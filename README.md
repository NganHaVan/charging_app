# Charging app 📝

The app can do the following tasks

1. Company (Provider) can register as charger provider
2. Company (Provider) can create their chargers and price
3. User can register using phone number
4. User can book charger
5. User can view booking history
6. User pay when booking end (using stripe)

Requirement:

- REST api with swagger
- Unit testing / Integration testing
- Proper authorization for company/user

## Get Started 🚀

1. Install dependencies

```bash
yarn install
```

2. Run dev

```bash
yarn dev
```

3. Run test

```bash
yarn test
```

## Structure folder 🔥

- \_\_test\_\_: Contains all the testing cases for all endpoints
- config: Contains config files for server, database and stripe (ignored)
- controllers: controller files for providers, users and chargers
- database/transaction: Contains mongoDB transaction
- mock: mock data for testing
- models: MongoDB models of users, chargers and providers
- routes: basic app routes
- types
- utils

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file  
`PORT`

`MONGO_URI`

`JWT`

`STRIPE_SECRET`

`STRIPE_PUBLIC_KEY`

`NODE_ENV`
