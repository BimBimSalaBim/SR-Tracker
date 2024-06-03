# SR Tracker

SR Tracker is a simple service request management tool designed to be more manageable than Cherwell. This project includes a Vue.js frontend with features like dark mode, item management, AI-powered item generation, and archiving of requests.

## Features

- **Dark Mode**: Toggle between light and dark mode for better visibility and reduced eye strain.
- **Import/Export Data**: Easily import and export request data in JSON format.
- **AI-Powered Item Generation**: Automatically generate items for requests using AI.
- **Request Management**: Add, edit, remove, and archive requests.
- **Appointment Scheduling**: Schedule appointments for service requests.
- **Filter and Search**: Search and filter requests by various criteria.
- **Archived Requests View**: View archived requests separately from active requests.

## Technologies Used

- **Frontend**: Vue.js, Materialize CSS
- **Backend**: Node.js, Express (for API endpoints)
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.
- An OpenAI API key for AI-powered item generation.

### Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/sr-tracker.git
cd sr-tracker
```

2. Install frontend dependencies:

```sh
cd frontend
npm install
```

3. Install backend dependencies:

```sh
cd ../backend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory with the following content:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5000
```

2. Ensure the backend server is properly configured to handle API requests from the frontend.

### Running the Project

1. Start the backend server:

```sh
cd backend
npm start
```

2. Start the frontend development server:

```sh
cd ../frontend
npm run serve
```

3. Open your browser and navigate to `http://localhost:8080`.

## Usage

### Import Data

1. Click the `Import` button in the sidebar.
2. Select a JSON file containing service request data.

### Export Data

1. Click the `Export` button in the sidebar.
2. A JSON file containing the current service request data will be downloaded.

### Toggle Dark Mode

1. Click the `Dark Mode` button in the sidebar to toggle between light and dark mode.

### View Archived Requests

1. Click the `View Archived Requests` button in the sidebar to toggle between viewing active and archived requests.

### AI-Powered Item Generation

1. Click the `Auto Generate with AI for All` button to generate items for all requests without items using AI.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Vue.js](https://vuejs.org/)
- [Materialize CSS](https://materializecss.com/)
- [OpenAI](https://openai.com/)
