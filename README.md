# devmemos backend API side

This api is a part of devmemos app with MERN stack

## How to use

- run 'git clone ...'
- run 'npm start'

Note: Make sure you have nodemon installed in your system otherwise you can install it as a dev dependency in the project.

## API resources

### User API Resources

All the user API router follows '/v1/user'

| #   | Routers                          | Verbs | Progress |Is private| Description                                     |
|-----|----------------------------------|-------|----------|------------|-----------------------------------------------|
| 1   | '/v1/user/login'                 | POST  | TODO     | No        | Verify user Authentication and return JWT      |
| 1   | '/v1/user/request-reset-password'| POST  | TODO     | No        | Verify email and email pin to reset thepassword|
| 1   | '/v1/user/reset-password         | PUT   | TODO     | No        | Replace existing password                      |
| 1   | '/v1/user/{id}'                  | GET   | TODO     | Yes       | Get users info                                 |

#####
our API needs the following routes:
- create/get/update/delete a new user
- create/get/update/delete a new notebook
- create/get/update/delete a new note

all the user API routes follows '/api/v1/users'
- POST  /api/v1/users
- GET  /api/users/:id
- PUT  /api/users/:id
- DELETE  /api/users/:id
The user also needs to login, to reset their password. 

all the notebook API routes follows '/api/v1/notebooks'
- POST  /api/v1/users/:id/notebooks       : add a new notebook to a user 
- GET  /api/v1/users/:id/notebooks        : get all notebooks by user
- GET  /api/v1/users/:id/notebooks/:id    : get a notebook by user 
- PUT  /api/v1/users/:id/notebooks/:id    : update a notebook by user
- DELETE  /api/v1/users/:id/notebooks/:id : delete a notebook by user 

all the notes API routes follows '/api/v1/notebooks/:id/notes'
- POST  /api/v1/notebooks/:id/notes     : add a new note to a notebook
- GET  /api/notebooks/:id/notes         : get all notes by notebook
- PUT  /api/notebooks/:id/notes/:id     : get a note by notebook   
- DELETE  /api/notebooks/:id/notes/:id  : to delete a note by notebook

----------


#####

### User API Resources

All the user API router follows '/v1/user'

| #   | Routers                          | Verbs | Progress |Is private| Description                                     |
|-----|----------------------------------|-------|----------|------------|-----------------------------------------------|
| 1   | '/v1/user/login'                 | POST  | TODO     | No        | Verify user Authentication and return JWT      |