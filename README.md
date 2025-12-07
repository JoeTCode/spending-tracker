# 📊 Personal Finance Tracker - [TrackYourTransactions](https://trackyourtransactions.co.uk)

A web-based spending tracker that helps users understand, categorise, and visualise their bank transaction history.
Simply upload a CSV file exported from your bank, and the app automatically categorises your transactions and generates meaningful insights.

<img width="1525" height="1213" alt="dashboard-page" src="https://github.com/user-attachments/assets/f2934e24-a78c-42c9-9774-658f9f97424b" />

# 🛠 Tech Stack

- Backend (and fronted) hosted with AWS EC2 and Nginx.
  
## Frontend (Javascript)
- React + TailwindCSS.
- CSV parsing with with react-papaparse
- Data visualisation with Recharts and AG-Grid.
- Data persistence implemented with DexieDB.
  
## Backend (Javascript)
- Node.js + Express.
- MongoDB for login information and metadata storage.
  
## AI Endpoint (Python)
- Classification model(s) trained, evaluated, and implemented using Tensorflow + Pandas + NumPy.
- Text embedding handled using OpenAI's text-embedding-3-small.
- Endpoint containerised using Docker.
- Endpoint hosted using AWS Lambda + AWS API Gateway.
  
# 💻 Model/Dataset statistics

## Models evaluated:
- MLP
- LogReg
- OpenAI (ChatGPT)
- Random Forest
- SVM

The final model chosen was the **Multi-Layer Perceptron (MLP)**. Trained on a 974 row (with duplicates) training dataset.
**~75% accuracy score** `(actual * 100 / predicted)` on a 411 row test dataset.

## 🔨 Model Architecture:
```
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(input,)),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
```

## 📊 Datasets - Category Distribution
**Test dataset - Unique values category distribution:**
```
Number of uniques values in each category:
Category
Housing & Bills      6
Finance & Fees       8
Entertainment       11
Income              16
Shopping            21
Other / Misc        39
Health & Fitness    50
Transport           56
Groceries           69
Eating Out          93
```
**Train dataset - Unique values category distribution:**
```
Number of uniques values in each category:
Category
Income               1
Transfer             1
Housing & Bills      3
Finance & Fees       3
Groceries           13
Other / Misc        14
Entertainment       16
Health & Fitness    23
Shopping            25
Transport           28
Eating Out          41
```

# 🚀 Features

## 🌗 Seamless Light and Dark Mode Support

## 🧠 AI Integration
Uses OpenAI's text-embedding-3-small model to generate high dimension embeddings from user's transaction data, then classifies these embeddings using a custom, pre-trained MLP.
The model weights (global and personalised) are stored in MongoDB, and are accessed by the AI Endpoint.
Every transaction is assigned to one of 10 spending categories:
`Groceries, Eating Out, Transport, Housing & Bills, Entertainment, Shopping, Health & Fitness, Finance & Fees, Income, Other / Misc`

### ⚙️ Multi-model support
  - **Personalised model:** Each user has a personalised model - the personalised model can:
    - Learn more quickly from the user’s historical spending patterns.
    - Better adapt to individual merchant-specific habits (e.g., “Local Market” = Groceries for one user but Eating Out for another).
  - **Global model:** The global model is a highly generalised model, recieving weight updates from all users. This (ideally) makes it a jack-of-all-trades but master of none model.

### 💡 Continuous Learning
  - This allows users to finetune the selected model based on recategorised transactions. Finetuning the global model has reduced influence compared to finetuning the personalised model.
    
### 🔍 Other notable features
- Keyword-based merchant classification using REGEX.
- Fallback rules for ambiguous transactions.
- Clean normalisation of merchant names (“TESCO 1234” → “Tesco”).

## 📝 Editable Transactions Table

<img width="1525" height="1226" alt="transactions-page" src="https://github.com/user-attachments/assets/5d0a9837-daf6-44aa-9648-0ccb38ede919" />

A highly customisable table that stores uploaded transaction data.
Features include:
- **Fully custom undo/redo system** - supports row editing, row deletion, row addition.
- **Model finetuning on user re-categorised rows.**
- **Filtering by uploaded CSV.**
- **CSV Export.**
- Transaction re-categorisation.
- Filtering by month.
- Row deletion.
- Row editing.
- Sorting by column.
  
## 📁 CSV Upload & Parsing

<img width="2557" height="1141" alt="upload-page" src="https://github.com/user-attachments/assets/06e3c536-dd7b-411a-84ce-af251f3e12bb" />

Implements a robust, multi-stage, upload process, allowing the user to map bank CSV columns to values expected by the system. Allows the saving of mappings to streamline future uploads. 
Implements graceful error-handling and warns the user if it is suspected that a column has been incorrectly mapped.

Upload stages:
- **Upload CSV:** The bank CSV is parsed using react-papaparse.
- **Column mapping:** Provides the user an interface to map their bank's CSV to the systems expected columns.
  - Transaction Date => Supporting EU or US format.
  - Transaction Description.
  - Amount => Supporting both a single amount column with both negative and positive values and two amount columns (for debit and credit / income and expense).
- **Duplicate Detection:** Detects and warns user of duplicate transactions between uploaded CSV and stored transactions.
- **Confidence scoring:** Allows users to recategorise low confidence.

## 🔐 User-Friendly Data Flows & Secure Design
- **Secure and easy account deletion** that deletes all associated account data.
- Secure custom login flow adhering to OWASP guidelines, utilising **JWT's + Refresh Tokens**.
- **Auth0 integration** to allow login with accredited vendors (Google, Github, etc.).
- CSV upload process streamlined via intuitive progress bar.
- **Transaction data only stored on the client-side.** (If auto-categorisation is enabled, transaction data is sent to the AI Endpoint upon upload, but it is never stored in our servers).
  
## 🧹 Data Cleaning & Preprocessing
- Automatic removal of empty CSV rows.
- Standardising of date formats using date-fns.
- Detecting and correcting negative/positive mismatches in amount column(s).

## Data Visualisation

### 📉 Spending Breakdown Charts
- Pie Chart: Category distribution.
- Line Graph: Monthly totals.
- Bar Graph Income vs. expenses summary.

### 📅 Timeline View Grid
How your spending evolves month-by-month.
Displays:
- Percentage increase/decrease between months for each major category.

### 💷 Financial Overview Card
Displays:
- Total spend.
- Total income.
- Total net.

# ⏳ Possible Future Enhancements
- Direct integration with banking apps, bypassing the need to download a CSV.
- Better DB (currently using free DB tier for heavy model storage).
- Improved ML classifier model accuracy and generalisation. (Currently trained on a limited and biased dataset).
- Fully/more customisable dashboard.
- Budgeting system (allowing users to set budgets per category).
- Custom category support.
- Automatic recurring payment detection from analysing transaction data.
- Payment integration (e.g. using Stripe).
