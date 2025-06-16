import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashbaordLocksense from "./Dashboard";
import EditUserFormLocksense from "./EditUserForm";
import AboutLocksense from "./About";
import ContactLocksense from "./Contact";
import LoginAdminLocksense from "./admin/LoginAdmin";
import DashboardAdminLocksense from "./admin/AdminDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="page-wrapper">
        <Routes>
          <Route path="/" element={<DashbaordLocksense />} />
          <Route path="/edituserform" element={<EditUserFormLocksense />} />
          <Route path="/about" element={<AboutLocksense />} />
          <Route path="/contact" element={<ContactLocksense />} />
          <Route path="/loginadmin" element={<LoginAdminLocksense />} />
          <Route path="/dashboardadmin" element={<DashboardAdminLocksense />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
