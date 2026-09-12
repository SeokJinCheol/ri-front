import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard.tsx';
import Profile from './profile.tsx';

const HomePage = () => {
    return (
            <Routes>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
            </Routes>
    )
}

export default HomePage
