import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import MainView from './views/MainView';

const AppContent = () => {
    const { roomNumber } = useApp();

    // Simple routing: if no room number, show Login, else show MainView
    if (!roomNumber) {
        return <Login />;
    }

    return <MainView />;
};

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
