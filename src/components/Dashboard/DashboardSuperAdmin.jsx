
import React from "react";
import UserList from "./SuperAdmin/UserList";
import GarageList from "./SuperAdmin/GarageList";
import AvisList from "./SuperAdmin/AvisList";
import PrestationList from "./SuperAdmin/PrestationList";
import { getProfile, getPrestations } from "../../services/api";

const DashboardSuperAdmin = () => {
  return (
    <div className="container py-5">
      <h1 className="mb-4">Dashboard Super Admin</h1>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <UserList api={getProfile} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <GarageList api={getProfile} />
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <AvisList api={getProfile} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <PrestationList api={getPrestations} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuperAdmin;
