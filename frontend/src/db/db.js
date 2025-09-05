// db.js
import Dexie from 'dexie';
import { v5 as uuidv5 } from "uuid";
import { CATEGORIES } from '../utils/constants/constants';

const CATEGORIES_SET = new Set(CATEGORIES);

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

export async function getTransactions(rangeType, selectedMonth=null, numRetrieved=null, customStart=null, customEnd=null) {
    let transactions = [];
    switch (rangeType) {
        case 'custom':
            transactions = await db.barclaysTransactions
                .where('date')
                .between(customStart, customEnd, true, false) // true= includes bounds
                .toArray();
            break;
        case 'latest-n':
            transactions = await db.barclaysTransactions
                .orderBy("date")   // order by the "date" index
                .reverse()         // descending (latest first)
                .limit(numRetrieved)
                .toArray();        // convert to array
            break;
        case 'd':
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            weekAgo.setHours(0, 0, 0, 0);
            
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);

            transactions = await db.barclaysTransactions
                                    .where('date')
                                    .between(weekAgo, end, true, false) // true= includes bounds
                                    .toArray();
            break;

        case 'm':
            const thisMonth = new Date();
            thisMonth.setHours(0, 0, 0, 0);
            thisMonth.setDate(1);

            transactions = await db.barclaysTransactions
                                    .where('date')
                                    .aboveOrEqual(thisMonth)
                                    .toArray();
            break;

        case 'a':
            transactions = await db.barclaysTransactions.toArray();
            break;

        case 'vm':
            const monthStart = new Date();
            monthStart.setHours(0, 0, 0, 0);
            monthStart.setDate(1);
            monthStart.setMonth(selectedMonth);
        
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1)

            transactions = await db.barclaysTransactions
                        .where('date')
                        .between(monthStart, monthEnd, true, false) // true=true includes bounds
                        .toArray();
            break;

        case 'y':
            const yearStart = new Date();
            yearStart.setHours(0, 0, 0, 0);
            yearStart.setDate(1);
            yearStart.setMonth(0);

            const yearEnd = new Date(yearStart);
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);

            transactions = await db.barclaysTransactions
                .where('date')
                .between(yearStart, yearEnd, true, false) // true=true includes bounds
                .toArray();
            break;
    };

    const response = [];
    for (let tx of transactions) {
        response.push(
            {
                _id: tx['_id'],
                date: new Date(tx['date']).toISOString().split('T')[0],
                amount: tx['amount'],
                type: tx['type'],
                category: tx['category'],
                description: tx['description']
            }
        );
    };

    return response;
};

export async function updateTransaction(transaction) {
    if (CATEGORIES_SET.has(transaction["Category"])) {
        await db.barclaysTransactions.put(transaction._id, { ...transaction, trained: false });
    } else {
        await db.barclaysTransactions.put(transaction._id, transaction);
    };
};

export async function deleteTransaction(transaction) {
    await db.barclaysTransactions.delete(transaction._id);
}

export { db, validateTransaction };