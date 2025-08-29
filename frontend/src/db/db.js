// db.js
import Dexie from 'dexie';
import { v5 as uuidv5 } from "uuid";

// '++id, date, amount, type, category, description, is_trainable, trained'
const db = new Dexie('transactionsDB');

db.version(1).stores({
    barclaysTransactions: '_id, date, amount, category, is_trainable, trained' // Primary key and indexed props
});

function validateDate(date) {
    date = date instanceof Date ? date : new Date(date);
    if (isNaN(date.getTime())) {
        date = new Date(); // set tx date to now
    };
    return date;
};

function validateAmount(amount) {
    amount = parseFloat(amount) ? parseFloat(amount) : 0;
    return Math.round(amount * 100) / 100; // normalize decimals 2 d.p.
};

function validateType(type) {
    let validatedType = "";
    if (typeof type === "string") {
        validatedType = type.trim();
    };

    return validatedType;
};

function validateCategory(category) {
    let validatedCategory = "";
    if (typeof category === "string") {
        validatedCategory = category.trim();
    };

    return validatedCategory;
};

function validateDescription(description) {
    let validatedDescription = "";
    if (typeof description === "string") {
        validatedDescription = description.trim();
    };

    return validatedDescription;
};

function makeTransactionId(tx) {
    // checks for uniqueness in account, date, amount, description, and type fields. As the date field does not include time,
    // a CSV row check is implemented. This means two uploads of the same CSV file will generate the same _id per row, causing
    // duplicate error.
    // Adversely, transactions with identical fields in a different CSV will be be allowed. This can be bypassed with
    // a date overlap check before CSV upload.
    const raw = `${tx.row}|${tx.account}|${tx.date.toISOString()}|${tx.amount}|${tx.description}|${tx.type}`;
    // Hash it so it's consistent
    return uuidv5(raw, uuidv5.URL); // namespace-based UUID
};

function validateTransaction(tx, row) {
     // Default boolean fields
    const is_trainable = tx.is_trainable ?? true;
    const trained = tx.trained ?? false;

    // create _id property
    const account = tx.account;
    const date = validateDate(tx.date);
    const amount = validateAmount(tx.amount);
    const type = validateType(tx.type);
    const category = validateCategory(tx.category);
    const description = validateDescription(tx.description);
    const _id = tx._id ?? makeTransactionId({ row, account, date, amount, type, description })

    return {
        _id,
        account,
        date,
        amount,
        type,
        category,
        description,
        is_trainable: is_trainable ?? true,
        trained: trained ?? false
    };
};

export { db, validateTransaction };