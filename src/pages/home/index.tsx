import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './dashboard.tsx';
import Profile from './profile.tsx';

const HomePage = () => {
    return (
        <div>
            <h1>Home Page</h1>
            <nav className="flex gap-4 my-4">
                <Link to="/home" className="text-blue-500 hover:underline">Dashboard</Link>
                <Link to="/home/profile" className="text-blue-500 hover:underline">Profile</Link>
            </nav>
            <Routes>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
            </Routes>
        </div>
    )
}

export default HomePage
