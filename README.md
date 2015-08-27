# Installation guide
0. It is advised to run this app on ubuntu.
1. Install nodejs
2. Install npm (packet manager for nodejs)
3. cd app (from this folder)
4. sudo npm install
5. Configure your postgres database, there should be user postgres with password: 1234.
Postgres server should run on 5432 port.
6. Create database cooking_genie in postgres.
7. Populate cooking_genie database with data by running script create_database.sql.
8. Run "sudo npm start" from within app folder.
9. Type in localhost:3000 into your browser. Enjoy!
