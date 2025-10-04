// db.js
import Dexie from 'dexie';
import { v5 as uuidv5 } from "uuid";
import { CATEGORIES } from '../utils/constants/constants';
import { parse } from "date-fns";

const CATEGORIES_SET = new Set(CATEGORIES);

const db = new Dexie('transactionsDB');

db.version(1).stores({
    csvData: '++id, &name, date, dateFormat',
    // '_id, date, amount, type, category, description, is_trainable, trained'
    transactions: '_id, date, amount, category, is_trainable, trained, csvId', // Primary key and indexed props
    // _id, last_reminder, title, amount, interval
    recurringPayments: '_id, last_reminder, title, amount, interval',
    // _id, mappingTitle, date, account, amount, amountDescriptor, amountMappings, description, category
    savedMappings: '_id'
});

function parseDate(dateString, region = "EU") {
    if (dateString instanceof Date) {
        console.warn("Date object passed to parseDate. Expected String.")
        return new Date(dateString); // return a copy
    };
    
    const euFormats = [
        "dd/MM/yyyy",
        "dd-MM-yyyy",
        "dd.MM.yyyy",
        "dd MMM yyyy",  // 15 Jan 2024
        "dd-MMM-yyyy",  // 15-Jan-2024
        "dd/MMM/yyyy", // 15/Jan/2024
        "yyyy MM dd",
        "yyyy-MM-dd",
        "yyyy/MM/dd",
    ];

    const usFormats = [
        "MM/dd/yyyy",
        "MM-dd-yyyy",
        "MM.dd.yyyy",
        "MMM dd yyyy",  // Jan 15 2024
        "MMM-dd-yyyy",  // Jan-15-2024
        "MMM/dd/yyyy", // Jan/15/2024
        "yyyy dd MM",
        "yyyy-dd-MM",
        "yyyy/dd/MM",
    ];

    const formats = region === "US" ? usFormats : euFormats;

    for (let fmt of formats) {
        const parsed = parse(dateString, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
        return parsed;
        };
    };

    // fallback: invalid => return new Date(now)
    console.warn("Could not parse date:", dateString);
    return new Date();
}

function validateAmount(amount) {
    amount = parseFloat(amount) ? parseFloat(amount) : 0;
    return Math.round(amount * 100) / 100; // normalize decimals 2 d.p.
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

function makeTransactionId({ row=null, account=null, date=null, amount=null, description=null } = {}) {
    // checks for uniqueness in account, date, amount, description. As the date field does not include time,
    // a CSV row check is implemented. This means two uploads of the same CSV file will generate the same _id per row, causing
    // duplicate error.
    // Adversely, transactions with identical fields in a different CSV will be be allowed. This can be bypassed with
    // a date overlap check before CSV upload.
    // normalize date to UTC day
    let dateTimestamp = '';
    if (date) {
        const d = new Date(date);
        dateTimestamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    };
    
    const raw = [row, account, dateTimestamp, amount, description]
                .filter(v => v != null)  // removes null and undefined
                .join('|');
    // hash
    return uuidv5(raw, uuidv5.URL); // namespace-based UUID
};

function validateTransaction(tx, row, dateFormat) {
     // Default boolean fields
    const is_trainable = tx.is_trainable ?? true;
    const trained = tx.trained ?? false;

    // create _id property
    const account = tx.account;
    const date = parseDate(tx.date, dateFormat);
    const amount = validateAmount(tx.amount);
    // const type = validateType(tx.type);
    const category = validateCategory(tx.category);
    const description = validateDescription(tx.description);
    const _id = tx._id ?? makeTransactionId({ row:row, account:account, date:date, amount:amount, description:description })

    return {
        _id,
        account,
        date,
        amount,
        category,
        description,
        is_trainable: is_trainable ?? true,
        trained: trained ?? false
    };
};

export async function getTransactions(
    {
        rangeType,
        selectedMonth = null,
        numRetrieved = null,
        customStart = null,
        customEnd = null,
        sorted = null,
        selectedYear = null,
    } = {})
{
    let transactions = [];
    switch (rangeType) {
        case 'custom':
            transactions = await db.transactions
                .where('date')
                .between(customStart, customEnd, true, false) // true= includes bounds
                .toArray();
            break;
        case 'latest-n':
            transactions = await db.transactions
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

            transactions = await db.transactions
                                    .where('date')
                                    .between(weekAgo, end, true, false) // true= includes bounds
                                    .toArray();
            break;

        case 'm':
            const thisMonth = new Date();
            thisMonth.setHours(0, 0, 0, 0);
            thisMonth.setDate(1);

            transactions = await db.transactions
                                    .where('date')
                                    .aboveOrEqual(thisMonth)
                                    .toArray();
            break;

        case 'a':
            
            if (sorted === 'desc') {
                transactions = await db.transactions
                    .orderBy("date")
                    .reverse()   // latest first
                    .toArray();
            } else if (sorted === 'asc') {
                transactions = await db.transactions
                    .orderBy("date")
                    .toArray();
            } else transactions = await db.transactions.toArray();
            break;

        case 'vm':
            const monthStart = new Date();
            monthStart.setHours(0, 0, 0, 0);
            monthStart.setDate(1);
            monthStart.setMonth(selectedMonth);
            
            const monthEnd = new Date(monthStart);
            if (selectedYear) {
                monthStart.setFullYear(selectedYear);
                monthEnd.setFullYear(selectedYear);
            }
            monthEnd.setMonth(monthEnd.getMonth() + 1)

            transactions = await db.transactions
                        .where('date')
                        .between(monthStart, monthEnd, true, false) // true=true includes bounds
                        .toArray();
            break;

        case 'y':
            let yearStart = new Date();
            if (selectedYear) yearStart.setFullYear(selectedYear);
            yearStart.setHours(0, 0, 0, 0);
            yearStart.setDate(1);
            yearStart.setMonth(0);

            const yearEnd = new Date(yearStart);
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);

            transactions = await db.transactions
                .where('date')
                .between(yearStart, yearEnd, true, false) // true=true includes bounds
                .toArray();
            break;
    };

    const response = [];
    for (let tx of transactions) {
        response.push(
            {
                _id: tx._id,
                date: new Date(tx.date).toISOString().split('T')[0],
                amount: tx.amount,
                category: tx.category,
                description: tx.description,
                trained: tx.trained,
                is_trainable: tx.is_trainable,
                csvId: tx.csvId,
            }
        );
    };

    return response;
};

export async function getCsvData() {
    const transactions = await db.transactions
                    .orderBy("date")
                    .reverse()   // latest first
                    .toArray();

    return transactions.map(tx => ({
        account: tx.account,
        date: tx.date.toLocaleString(),
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
    }));
};

export async function updateTransaction(transaction) {
    if (CATEGORIES_SET.has(transaction["Category"])) {
        await db.transactions.put({ ...transaction, trained: false }, transaction._id);
    } else {
        await db.transactions.put(transaction, transaction._id);
    };
};

export async function deleteTransaction(transaction) { // not to be used
    await db.transactions.delete(transaction._id);
}

export async function bulkDeleteTransactions(transactions) {
    const keys = transactions.map(tx => tx._id);
    await db.transactions.bulkDelete(keys)
};

// For upload page only
export async function bulkAddTransactions(transactions, csvFilename, dateFormat) {
    let filename = csvFilename;
    if (!csvFilename) filename = new Date().toUTCString();
    const csvId = await db.csvData.add({ name: csvFilename, date: new Date().toUTCString(), dateFormat: dateFormat });
    const transcationsWithCsvId = transactions.map(tx => ({ ...tx, csvId: csvId }));
    await db.transactions.bulkAdd(transcationsWithCsvId);
};

// For Transactions page specifically
export async function removeTransaction(transaction) {
    const key = transaction._id;
    await db.transactions.delete(key);

    const remaining = await db.transactions.where("csvId").equals(transaction.csvId).count();
    if (remaining === 0) await db.csvData.delete(transaction.csvId);
};

// For Transactions page specifically
export async function bulkRemoveTransactions(transactions) {
    const keys = transactions.map(tx => tx._id);
    await db.transactions.bulkDelete(keys);

    // Create a map of the unique csvIds from the transactions that were removed
    const transactionsCsvIdMap = new Set(transactions.map(tx => tx.csvId));

    // Determine if the deletion will remove all instances of transactions with their specific csvId, if true, delete csvData with that csvId
    await Promise.all(
        [...transactionsCsvIdMap].map(async (csvId) => {
            const remaining = await db.transactions.where("csvId").equals(csvId).count();
            if (remaining === 0) {
                await db.csvData.delete(csvId);
            };
        })
    );

    // for (let csvId of [...transactionsCsvIdMap]) {
    //     const remaining = await db.transactions.where("csvId").equals(csvId).count();
    //     if (remaining === 0) {
    //         await db.csvData.delete(csvId);
    //     };
    // };
};

// For Transactions page specifically
export async function bulkRestoreTransactions(restoredTransactions, restoredCsvDataArray) {
    // csvIdToDataMap = { csvId: csvData, csvId: csvData } (mapping of each csvData's id to csvData)
    const restoredCsvIdToDataMap = {};
    for (let data of restoredCsvDataArray) {
        restoredCsvIdToDataMap[data.id] = data;
    };

    // check if any transaction csv ids were removed from csvData in a previous removeTransaction call - if true restore data
    const csvDataDbArray = await db.csvData.toArray();
    const dbCsvIdSet = new Set(csvDataDbArray.map(data => data.id));

    const missingCsvIds = new Set(
        restoredTransactions
            .map(tx => tx.csvId)
            .filter(id => !dbCsvIdSet.has(id))
    );

    for (let id of missingCsvIds) {
        await db.csvData.add(restoredCsvIdToDataMap[id]);
    };

    // reparse date fields according to the original date format (EU/US)
    const parsedTransactions = restoredTransactions.map(tx => ({ ...tx, date: parseDate(tx.date, restoredCsvIdToDataMap[tx.csvId].dateFormat )}));

    // add parsed transactions to db
    await db.transactions.bulkAdd(parsedTransactions);
    return parsedTransactions;
};

// For Transactions page specifically
export async function restoreTransaction(transaction, restoredCsvData) {
    console.log(transaction, restoredCsvData);
    const csvDataDbArray = await db.csvData.toArray();

    const missingId = csvDataDbArray.map(data => data.id).filter(id => id !== transaction.csvId);
    console.log(missingId);
    if (missingId && missingId.length > 0) {
        await db.csvData.add(restoredCsvData);
    };

    const parsedTransaction = { ...transaction, date: parseDate(transaction.date, restoredCsvData.dateFormat) };
    console.log(parsedTransaction);
    await db.transactions.add(parsedTransaction);
};

export async function getPayments(rangeType) {
    let payments;
    switch (rangeType) {
        case 'a':
            payments = await db.recurringPayments.toArray();
            break;
        case 'd':
            const allPayments = await db.recurringPayments.toArray();
            const today = new Date();

            payments = allPayments.filter(payment => {
                const dateOfLastReminder = new Date(payment.last_reminder);
                let dateOfNextReminder = new Date(dateOfLastReminder);

                switch (payment.interval) {
                    case "Weekly":
                        dateOfNextReminder.setDate(dateOfLastReminder.getDate() + 7);
                        break;
                    case "Bi-weekly":
                        dateOfNextReminder.setDate(dateOfLastReminder.getDate() + 14);
                        break;
                    case "Monthly":
                        dateOfNextReminder.setMonth(dateOfLastReminder.getMonth() + 1);
                        break;
                    case "Bi-monthly":
                        dateOfNextReminder.setMonth(dateOfLastReminder.getMonth() + 2);
                        break;
                    case "Quarterly":
                        dateOfNextReminder.setMonth(dateOfLastReminder.getMonth() + 3);
                        break;
                    case "Yearly":
                        dateOfNextReminder.setYear(dateOfLastReminder.getFullYear() + 1);
                        break;
                };

                dateOfNextReminder.setDate(dateOfNextReminder.getDate() - 1); // send reminder 1 day before
                return today.getTime() >= dateOfNextReminder.getTime()
            });
            break;
    };

    return payments;
};

export async function updatePayment(payment) {
    await db.recurringPayments.update(payment._id, payment);
};

export async function deletePayment(payment) {
    await db.recurringPayments.delete(payment._id);
};

export { db, validateTransaction, makeTransactionId };