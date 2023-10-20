# Full-Stack To-Do List with Drag-and-Drop Functionality

## The full app is in login-feature branch to keep the old version running

## Overview

This is a full-stack To-Do List application developed with a front-end built using React, and a back-end implemented with MongoDB for data persistence. The application incorporates a user-friendly drag-and-drop feature for easy task management. Users can add tasks, and optionally enrich them with gifs via the GIPHY API. Tasks can be moved across different columns representing their status, and deleted by dragging them to a bin. The application is designed with a responsive layout and employs JWT for secure authentication, along with hashed passwords for enhanced security and google log in for convienience. User-friendly alerts (toasts) are facilitated through the [Sonner] package, enhancing the user experience with visually appealing notifications. The front-end repository can be found [here](https://github.com/Pietrek1989/CodeClauseInternship_ToDoList/tree/login-feature).

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [How to Run Locally](#how-to-run-locally)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Add Tasks**: Users can add new tasks through a modal.
- **Add Gifs**: Users can optionally enrich tasks with gifs using the GIPHY API.
- **View Tasks**: Tasks are displayed in three columns: To-Do, Doing, and Done.
- **Move Tasks**: Users can drag-and-drop tasks to move them between columns.
- **Delete Tasks**: Drag tasks to the bin to delete them.
- **Persistent Storage**: Tasks are saved in the user's account on the database, ensuring that data is not lost between sessions.

## Technologies Used

- React.js
- React DnD (Drag and Drop)
- MongoDB for data persistence
- Google Auth for convienience
- Express.js and Node.js for the back-end server
- JWT for secure authentication
- Bcrypt for password hashing
- Sonner for user-friendly alerts (toasts)
- HTML5
- CSS
- [Front-end Repository](https://github.com/Pietrek1989/CodeClauseInternship_ToDoList/tree/login-feature)

![ToDoList](https://github.com/Pietrek1989/CodeClauseInternship_ToDoList/assets/68666992/ebf6cca6-7c6d-486e-858d-071400bfc7e7)

## How to Run Locally

1. **Clone the repository:**

    ```bash
    git clone https://github.com/Pietrek1989/your-repo-name.git
    ```

2. **Navigate to the project directory:**

    ```bash
    cd your-repo-name
    ```

3. **Install dependencies:**

    ```bash
    npm install
    ```

4. **Start the development server:**

    ```bash
    npm start
    ```

    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
