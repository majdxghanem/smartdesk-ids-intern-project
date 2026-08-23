import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Tickets from "./pages/tickets";
import CreateTicket from "./pages/CreateTicket";
import EditTicket from "./pages/editticket";
import Assignmen from "./pages/Assignmen";
import TicketDetails from "./pages/TicketDetails";
import TicketComments from "./pages/TicketComments";
import TicketActivity from "./pages/TicketActivity";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import ReferenceData from "./pages/ReferenceData";
import ProtectedRoute from "./components/ProtectedRoute";

const authenticated = (page, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{page}</ProtectedRoute>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={authenticated(<Dashboard />)} />
      <Route path="/tickets" element={authenticated(<Tickets />)} />
      <Route
        path="/create-ticket"
        element={authenticated(<CreateTicket />, ["Admin", "Employee"])}
      />
      <Route path="/tickets/edit/:id" element={authenticated(<EditTicket />)} />
      <Route
        path="/tickets/assign/:id"
        element={authenticated(<Assignmen />, ["Admin", "Manager"])}
      />
      <Route path="/tickets/:id" element={authenticated(<TicketDetails />)} />
      <Route path="/tickets/:id/comments" element={authenticated(<TicketComments />)} />
      <Route path="/tickets/:id/activity" element={authenticated(<TicketActivity />)} />
      <Route
        path="/reports"
        element={authenticated(<Reports />, ["Admin", "Manager"])}
      />
      <Route path="/settings/reference" element={authenticated(<ReferenceData />, ["Admin"])} />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/create"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <CreateUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <EditUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
