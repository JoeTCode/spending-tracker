export const MONTHS = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ];
export const DAYS = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];
export const CATEGORIES = ["Groceries", "Housing & Bills", "Finance & Fees", "Transport", "Income", "Shopping", "Eating Out", "Entertainment", "Health & Fitness", "Transfer", "Other / Misc"];
export const IDX_TO_LABELS = Object.fromEntries(
    CATEGORIES.map((v, k) => [k, v])
);
export const LABELS_TO_IDX = Object.fromEntries(
    CATEGORIES.map((v, k) => [v, k])
);
export const MIN_CONF_SCORE = 0.7