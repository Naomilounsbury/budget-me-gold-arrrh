const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open("budget", 1);
// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_transaction", { autoIncrement: true });
};
// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};
// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  budgetObjectStore.add(record);
}
function uploadBudget() {
  // open a transaction on your pending db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access your pending object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["new_transaction"], "readwrite");
          const budgetObjectStore = transaction.objectStore("new_transaction");
          // clear all items in your store
          budgetObjectStore.clear();
        })
        .catch((err) => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadBudget);
