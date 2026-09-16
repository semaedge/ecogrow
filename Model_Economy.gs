/** Ledger financeiro e atualização de saldo protegidos pelo mesmo lock. */

function Model_Economy_getTransactionsByUserId(userId, limit) {
  const data = DB_Connection.readAllData("EconomyTransactions");
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(function(row) {
    const entry = {};
    headers.forEach(function(header, index) { entry[header] = ["amount", "balanceAfter"].indexOf(header) !== -1 ? Number(row[index]) || 0 : row[index]; });
    return entry;
  }).filter(function(entry) { return entry.userId === userId; }).sort(function(left, right) { return new Date(right.timestamp) - new Date(left.timestamp); }).slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
}

function Model_Economy_applyTransaction(userId, type, amount, referenceId, description) {
  amount = Number(amount);
  if (!userId || !isFinite(amount) || amount === 0 || Math.abs(amount) > 1000000) throw new Error("Invalid economy transaction.");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let users = getSheet("Users").getDataRange().getValues();
    let ledger = getSheet("EconomyTransactions").getDataRange().getValues();
    users = Model_User_ensureTableData(users);
    ledger = Model_Economy_ensureTable(ledger);
    const userHeaders = users[0];
    const ledgerHeaders = ledger[0];
    const userIdIndex = userHeaders.indexOf("id");
    const balanceIndex = userHeaders.indexOf("balance");
    const ledgerUserIndex = ledgerHeaders.indexOf("userId");
    const referenceIndex = ledgerHeaders.indexOf("referenceId");
    const existingRow = referenceId ? ledger.slice(1).find(function(row) { return row[ledgerUserIndex] === userId && row[referenceIndex] === referenceId; }) : null;
    if (existingRow) return Model_Economy_fromRow(ledgerHeaders, existingRow, true);
    const userRow = users.slice(1).find(function(row) { return row[userIdIndex] === userId; });
    if (!userRow) throw new Error("User not found.");
    const currentBalance = Number(userRow[balanceIndex]) || 0;
    const balanceAfter = currentBalance + amount;
    if (balanceAfter < 0) return { applied: false, reason: "INSUFFICIENT_FUNDS", balanceAfter: currentBalance };
    const transaction = {
      id: Utilities.getUuid(), userId: userId, type: Utils_Validation.normalizeText(type, 50), amount: amount,
      balanceAfter: balanceAfter, referenceId: Utils_Validation.normalizeText(referenceId, 150),
      description: Utils_Validation.normalizeText(description, 250), timestamp: new Date().toISOString()
    };
    userRow[balanceIndex] = balanceAfter;
    ledger.push(ledgerHeaders.map(function(header) { return transaction[header] !== undefined ? transaction[header] : ""; }));
    try {
      writeAllDataUnlocked("Users", users);
      writeAllDataUnlocked("EconomyTransactions", ledger);
    } catch (writeError) {
      // Compensação de melhor esforço: evita saldo sem lançamento se a segunda escrita falhar.
      userRow[balanceIndex] = currentBalance;
      try { writeAllDataUnlocked("Users", users); } catch (rollbackError) {
        Utils_Logger.logError("Model_Economy", "Balance rollback failed: " + rollbackError.message);
      }
      throw writeError;
    }
    transaction.applied = true;
    return transaction;
  } finally {
    lock.releaseLock();
  }
}

function Model_Economy_ensureTable(data) {
  const headers = ["id", "userId", "type", "amount", "balanceAfter", "referenceId", "description", "timestamp"];
  return !data.length || !data[0].some(function(value) { return value !== ""; }) ? [headers] : data;
}

function Model_Economy_fromRow(headers, row, duplicate) {
  const result = { applied: false, duplicate: !!duplicate };
  headers.forEach(function(header, index) { result[header] = ["amount", "balanceAfter"].indexOf(header) !== -1 ? Number(row[index]) || 0 : row[index]; });
  return result;
}
