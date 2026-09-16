/**
 * Arquivo: Model_User.gs
 * Funcionalidades: Implementa as operações CRUD (Create, Read, Update, Delete) para usuários. Grava e lê dados da aba "Users" na planilha.
 * Integrações: DB_Connection.gs, Auth_Controller.gs.
 * Dependências: DB_Connection.gs, Utils_Logger.gs.
 */

function Model_User_getUsersSheet() {
  return DB_Connection.getSheet("Users");
}

function Model_User_getAllUsers() {
  const data = DB_Connection.readAllData("Users");
  if (data.length <= 1) return []; // Ignora o cabeçalho
  const headers = data[0];
  return data.slice(1).map(row => {
    let user = {};
    headers.forEach((header, i) => user[header] = row[i]);
    return Model_User_normalizeRecord(user);
  });
}

function Model_User_normalizeRecord(user) {
  user = user || {};
  function first(keys, fallback) {
    for (let i = 0; i < keys.length; i++) {
      if (user[keys[i]] !== undefined && user[keys[i]] !== '') return user[keys[i]];
    }
    return fallback;
  }
  const normalizedUsername = String(first(['username', 'Username', 'Usuario', 'Usuário'], '') || '').trim();
  const storedId = first(['id', 'ID', 'Id', 'UserID'], '');
  return Object.assign({}, user, {
    // Contas inseridas manualmente na frota nem sempre receberam ID. O login
    // ainda precisa de uma identidade estável para sessão e perfil.
    id: String(storedId || (normalizedUsername ? 'legacy:' + normalizedUsername.toLowerCase() : '')),
    username: normalizedUsername,
    password: first(['password', 'Password', 'Senha'], ''),
    role: first(['role', 'Role', 'Papel'], 'player'),
    email: first(['email', 'Email'], ''),
    displayName: first(['displayName', 'DisplayName', 'Nome'], ''),
    balance: first(['balance', 'Balance', 'Saldo'], 0),
    createdAt: first(['createdAt', 'CreatedAt', 'CriadoEm'], '')
  });
}

function Model_User_getUserByUsername(username) {
  const normalizedUsername = String(username == null ? "" : username).trim().toLowerCase();
  const users = Model_User_getAllUsers();
  return users.find(user => String(user.username || "").toLowerCase() === normalizedUsername);
}

function Model_User_getUserById(id) {
  const users = Model_User_getAllUsers();
  return users.find(user => user.id === id);
}

function Model_User_createUser(username, password, role) {
  username = String(username == null ? "" : username).trim();
  if (!username) throw new Error("Username is required.");
  const newId = Utilities.getUuid();
  const newUser = { id: newId, username: username, password: password, role: role || "player", email: "", displayName: username, balance: 0, createdAt: new Date().toISOString() };
  const created = DB_Connection.mutateSheetData("Users", function(data) {
    data = Model_User_ensureTableData(data);
    const headers = data[0];
    const usernameIndex = headers.indexOf("username");
    const duplicate = data.slice(1).some(function(row) {
      return String(row[usernameIndex] || "").toLowerCase() === username.toLowerCase();
    });
    if (duplicate) return { data: data, value: null };
    data.push(headers.map(function(header) { return newUser[header] !== undefined ? newUser[header] : ""; }));
    return { data: data, value: newUser };
  });
  if (created) Utils_Logger.logInfo("Model_User", "New user created: " + username);
  return created;
}

function Model_User_updateUser(userId, updates) {
  updates = updates || {};
  const allowedFields = ["username", "password", "role", "email", "displayName", "balance"];
  const updated = DB_Connection.mutateSheetData("Users", function(data) {
    data = Model_User_ensureTableData(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    let changed = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] !== userId) continue;
      allowedFields.forEach(function(key) {
        if (!Object.prototype.hasOwnProperty.call(updates, key)) return;
        const column = headers.indexOf(key);
        if (column !== -1) {
          data[i][column] = updates[key];
          changed = true;
        }
      });
      break;
    }
    return { data: data, value: changed };
  });
  if (updated) Utils_Logger.logInfo("Model_User", "User updated: " + userId);
  return updated;
}

function Model_User_deleteUser(userId) {
  const deleted = DB_Connection.mutateSheetData("Users", function(data) {
    data = Model_User_ensureTableData(data);
    const idIndex = data[0].indexOf("id");
    const kept = [data[0]];
    let removed = false;
    data.slice(1).forEach(function(row) {
      if (row[idIndex] === userId) removed = true;
      else kept.push(row);
    });
    return { data: kept, value: removed };
  });
  if (deleted) Utils_Logger.logInfo("Model_User", "User deleted: " + userId);
  return deleted;
}

function Model_User_ensureTableData(data) {
  const requiredHeaders = ["id", "username", "password", "role", "email", "displayName", "balance", "createdAt"];
  if (!Array.isArray(data) || !data.length || !data[0].some(function(value) { return value !== ""; })) return [requiredHeaders];
  const headers = data[0].slice();
  requiredHeaders.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) data[rowIndex].push("");
    }
  });
  data[0] = headers;
  return data;
}
