import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Navigation/Header';
import { VehicleList } from './components/Dashboard/VehicleList';
import { TripAnalysis } from './components/TripAnalysis/TripAnalysis';
import { Timesheet } from './components/Timesheet/Timesheet';
import { NoVehicleSelected } from './components/Common/NoVehicleSelected';
import { TimesheetReview } from './components/Timesheet/TimesheetReview';
import { CartrackAPI } from './services/api';
import './App.css';
import { ProcessedAssignment } from './types/timesheet';
import { Login } from './components/Auth/Login';

// Create a wrapper component for the success page to use hooks
const SuccessPage = () => {
  const navigate = useNavigate();
  return (
    <div className="success-page">
      <h2>Timesheet Submitted Successfully</h2>
      <p>Your timesheet has been processed and submitted to Connectwise.</p>
      <button 
        className="btn btn-primary" 
        onClick={() => navigate('/timesheet')}
      >
        Return to Timesheet
      </button>
    </div>
  );
};

// Create a wrapper component for TimesheetReview to use hooks
const TimesheetReviewWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <TimesheetReview 
      assignments={location.state?.assignments || []}
      onSubmit={async (assignments: ProcessedAssignment[]) => {
        await CartrackAPI.processTimesheet(assignments);
      }}
      onBack={() => navigate(-1)}
    />
  );
};

// Add authentication check
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <>
                <Header />
                <VehicleList />
              </>
            </PrivateRoute>
          } />
          <Route path="/trips" element={
            <PrivateRoute>
              <>
                <Header />
                <NoVehicleSelected />
              </>
            </PrivateRoute>
          } />
          <Route path="/trips/:registration" element={
            <PrivateRoute>
              <>
                <Header />
                <TripAnalysis />
              </>
            </PrivateRoute>
          } />
          <Route path="/timesheet" element={
            <PrivateRoute>
              <>
                <Header />
                <NoVehicleSelected />
              </>
            </PrivateRoute>
          } />
          <Route path="/timesheet/:registration" element={
            <PrivateRoute>
              <>
                <Header />
                <Timesheet />
              </>
            </PrivateRoute>
          } />
          <Route path="/timesheet/review" element={
            <PrivateRoute>
              <>
                <Header />
                <TimesheetReviewWrapper />
              </>
            </PrivateRoute>
          } />
          <Route path="/timesheet/success" element={
            <PrivateRoute>
              <>
                <Header />
                <SuccessPage />
              </>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
