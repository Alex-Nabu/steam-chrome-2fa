document.addEventListener('DOMContentLoaded', function() {
  load_accounts(function() {
    console.log('accounts loaded');
  });

  // create new account
  document.getElementById('add_account').addEventListener('click', e => {
    var row = document.createElement('tr');
    row.innerHTML = default_account_display_innerHTML;

    var first_col = row.children[0];
    var prev_data = first_col.innerHTML;

    var edit_buttons = row.querySelectorAll('.fa-pencil');
    var delete_buttons = row.querySelectorAll('.fa-trash');


    var user_name_feild = document.createElement('input');
    var shared_secret_feild = document.createElement('input');

    var save_new_data_button = document.createElement('button');
    var cancel_edit = document.createElement('button');

    save_new_data_button.textContent = "save";

    cancel_edit.textContent = "cancel";

    user_name_feild.type = 'text'; shared_secret_feild.type = 'text';

    user_name_feild.class = "edit_2fa_name"; shared_secret_feild.class = "edit_2fa_secret";

    user_name_feild.placeholder = "USERNAME";
    shared_secret_feild.placeholder = "SHARED SECRET";

    first_col.innerHTML = "";
    first_col.appendChild(user_name_feild);
    first_col.appendChild(shared_secret_feild);
    first_col.appendChild(save_new_data_button);
    first_col.appendChild(cancel_edit);


    // handle a cancel edit
    cancel_edit.addEventListener('click', delete_button_click_action);

    // handle saving edit
    save_new_data_button.addEventListener('click', save_account_edits);

    // register delete action
    Array.from(delete_buttons).forEach(delete_button => {
      delete_button.addEventListener('click', delete_button_click_action)
    })

    document.querySelector('tbody').appendChild(row);

    user_name_feild.focus();

  });

}, false);

var default_account_display_innerHTML = "<td></td><td><i class=\"fa fa-pencil button alterar\"></i><i class=\"fa fa-trash button excluir\"></i></td>";

// handle a click of the delete button on accounts
function delete_button_click_action(delete_click) {
  var row = delete_click.target.closest("tr");
  var first_col = row.children[0];

  row.outerHTML = "";
  delete row;

  var accounts;
  chrome.storage.local.get('accounts', function(resp) {
    accounts = JSON.parse(resp.accounts);

    delete accounts[first_col.dataset.name];

    chrome.storage.local.set({'accounts' : JSON.stringify(accounts)})
  });

}

// handle a click of the edit account icon
function edit_button_click_handler(e) {
  var row = e.target.closest("tr");
  var first_col = row.children[0];

  // if we are already in a editing phase
  if(first_col.childNodes.length > 1) {
    return;
  }

  var prev_data = first_col.innerHTML;

  var user_name_feild = document.createElement('input');
  var shared_secret_feild = document.createElement('input');

  var save_new_data_button = document.createElement('button');
  var cancel_edit = document.createElement('button');

  save_new_data_button.textContent = "save";

  cancel_edit.textContent = "cancel";

  // handle a cancel edit
  cancel_edit.addEventListener('click', cancel_click => {
    first_col.innerHTML = prev_data;
  });

  // handle saving edit
  save_new_data_button.addEventListener('click', save_account_edits);

  user_name_feild.type = 'text'; shared_secret_feild.type = 'text';

  user_name_feild.class = "edit_2fa_name"; shared_secret_feild.class = "edit_2fa_secret";

  user_name_feild.placeholder = "USERNAME";
  shared_secret_feild.placeholder = "SHARED SECRET";

  first_col.innerHTML = "";
  first_col.appendChild(user_name_feild);
  first_col.appendChild(shared_secret_feild);
  first_col.appendChild(save_new_data_button);
  first_col.appendChild(cancel_edit);
}


// handle saving account data
function save_account_edits(e) {
  var row = e.target.closest("tr");
  var first_col = row.children[0];

  var inputs = first_col.querySelectorAll('input');
  var username = inputs[0].value;
  var secret = inputs[1].value;

  window.accounts[username] = {"shared_secret" : secret};

  chrome.storage.local.set({'accounts' : JSON.stringify(accounts)})
  console.log(username);

  chrome.storage.local.get('accounts', function(resp) {
    console.log(resp);
  });

  row.innerHTML = default_account_display_innerHTML;

  first_col = row.children[0];
  first_col.textContent = username;
  first_col.dataset.name = username;

  var edit_buttons = row.querySelectorAll('.fa-pencil');
  var delete_buttons = row.querySelectorAll('.fa-trash');

  // register edit actions
  Array.from(edit_buttons).forEach(edit_button => {
    edit_button.addEventListener('click', edit_button_click_handler)
  });

  // register delete action
  Array.from(delete_buttons).forEach(delete_button => {
    delete_button.addEventListener('click', delete_button_click_action)
  })
}

// load the accounts we have stored
function load_accounts(cb) {
  chrome.storage.local.get('accounts', accounts => {

    if(accounts.accounts) {
      window.accounts = JSON.parse(accounts.accounts);
    } else {
      window.accounts = {};
    }

    var table = document.querySelector('tbody');

    Object.keys(window.accounts).forEach(account => {
      var row = document.createElement('tr');
      row.innerHTML = default_account_display_innerHTML;

      var first_col = row.children[0];

      var edit_buttons = row.querySelectorAll('.fa-pencil');
      var delete_buttons = row.querySelectorAll('.fa-trash');

      first_col = row.children[0];
      first_col.textContent = account;
      first_col.dataset.name = account;


      var edit_buttons = row.querySelectorAll('.fa-pencil');
      var delete_buttons = row.querySelectorAll('.fa-trash');

      // register edit actions
      Array.from(edit_buttons).forEach(edit_button => {
        edit_button.addEventListener('click', edit_button_click_handler)
      });

      // register delete action
      Array.from(delete_buttons).forEach(delete_button => {
        delete_button.addEventListener('click', delete_button_click_action)
      })

      table.appendChild(row);
    });

    if(cb) {
      cb();
    }
  })
}
