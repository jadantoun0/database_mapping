const fs = require('fs');
const pg = require('pg');

const config = {
    user: "avnadmin",
    password: process.env.PASSWORD,
    host: "pg-2c4efec9-jadantoun77-566a.h.aivencloud.com",
    port: 25016,
    database: "defaultdb",
    ssl: {
        rejectUnauthorized: false,
        ca: process.env.CA,
    },
};

const client = new pg.Client(config);

// Connect to PostgreSQL
client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => {
        console.error('Connection error', err.stack);
        process.exit(1);
    });

// Read and parse the JSON data
fs.readFile('stocks.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading JSON file', err);
        return;
    }

    try {
        const symbols = JSON.parse(data);

        // Prepare SQL insert statement
        const insertQuery = `
          INSERT INTO symbols (symbol, description, digits, contractSize, marginLong, marginShort, swapMode, swapLong, swapShort)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (symbol) DO NOTHING;
        `;

        // Insert data into the database
        const insertPromises = symbols.map(symbol => {
            const values = [
                symbol.Symbol,                       
                symbol.Description,                  
                parseInt(symbol.Digits, 10),        
                parseFloat(symbol.ContractSize),    
                parseFloat(symbol.MarginInitial),   
                parseFloat(symbol.MarginMaintenance),
                parseInt(symbol.SwapMode, 10),       
                parseFloat(symbol.SwapLong),         
                parseFloat(symbol.SwapShort),     
            ];

            return client.query(insertQuery, values)
                .catch(err => console.error('Insert error', err.stack));
        });

        // Wait for all insert operations to complete
        Promise.all(insertPromises)
            .then(() => {
                // Close the connection after processing
                return client.end();
            })
            .then(() => console.log('Connection closed'))
            .catch(err => console.error('Error closing connection', err.stack));

    } catch (parseError) {
        console.error('Error parsing JSON data', parseError);
    }
});
