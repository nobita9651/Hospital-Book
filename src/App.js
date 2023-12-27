// App.js

import "./App.css";
import React, { useState } from "react";

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [admitId, setAdmitId] = useState("");
  const [hospital, setHospital] = useState("");
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState({
    DoctorName: "",
    AdmitDate: "",
    AdmitID: "",
    CurrentProgress: 0,
    VisitorData: [],
  });
  const [admitIdForGet, setAdmitIdForGet] = useState("");
  const [visitorData, setVisitorData] = useState({
    Diagnosis: "",
    DiagDate: "",
    Prescription: "",
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);

  const handleLoginSignupToggle = () => {
    setIsLoginMode((prevMode) => !prevMode);
    setErrorMessage("");
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
      } else {
        const errorData = await response.json();
        setErrorMessage(`Login failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleSignup = async () => {
    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, admitId, hospital }),
      });

      if (response.ok) {
        // If signup is successful, perform the following actions
        setErrorMessage("");

        // Log in the user immediately after signup
        const loginResponse = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          setToken(data.token);

          // Save initial user data immediately after signup
          await handleSaveData();

          // Optionally, add initial visitor data immediately after signup
          handleAddVisitorData();
        } else {
          const errorData = await loginResponse.json();
          setErrorMessage(`Login failed: ${errorData.error}`);
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(`Signup failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  const handleSaveData = async () => {
    try {
      const response = await fetch("http://localhost:5000/saveData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...userData, hospital }),
      });

      if (response.ok) {
        console.log("Data saved successfully");
      } else {
        console.error("Save data failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error during saveData:", error);
    }
  };

  const handleGetVisitorData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/getVisitorData/${admitIdForGet}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserData((prevUserData) => ({
          ...prevUserData,
          VisitorData: Array.isArray(data.visitorData)
            ? data.visitorData.map((visitor) => ({
                ...visitor,
                DiagDate: new Date(visitor.DiagDate), // Convert to Date object
              }))
            : [],
        }));
      } else {
        console.error("Get visitor data failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error during getVisitorData:", error);
    }
  };

  const handleAddVisitorData = () => {
    setShowAddVisitorModal(true);
  };

  const submitVisitorData = () => {
    // Format the current date as a Date object
    const formattedDate = new Date();

    // Set the formatted date in the state
    setVisitorData((prevData) => ({
      ...prevData,
      DiagDate: formattedDate.toISOString(), // Store as ISO string
    }));

    setUserData((prevUserData) => ({
      ...prevUserData,
      VisitorData: [
        ...prevUserData.VisitorData,
        {
          Diagnosis: visitorData.Diagnosis,
          DiagDate: formattedDate, // Use the Date object directly
          Prescription: visitorData.Prescription,
        },
      ],
    }));

    setVisitorData({
      Diagnosis: "",
      DiagDate: "",
      Prescription: "",
    });

    // Close the modal after adding visitor data
    setShowAddVisitorModal(false);
  };

  return (
    <div>
      <h1>Medical App</h1>
      {!token ? (
        <>
          <div>
            {isLoginMode ? (
              <>
                <h2>Login</h2>
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button onClick={handleLogin}>Login</button>
                <p>
                  Don't have an account?{" "}
                  <span onClick={handleLoginSignupToggle}>Signup</span>
                </p>
              </>
            ) : (
              <>
                <h2>Signup</h2>
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label>
                  Admit ID:
                  <input
                    type="text"
                    value={admitId}
                    onChange={(e) => setAdmitId(e.target.value)}
                  />
                </label>
                <label>
                  Hospital:
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                  />
                </label>
                <button onClick={handleSignup}>Signup</button>
                <p>
                  Already have an account?{" "}
                  <span onClick={handleLoginSignupToggle}>Login</span>
                </p>
              </>
            )}
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </>
      ) : (
        <>
          <div>
            <h2>Enter User Data</h2>
            <label>
              Doctor Name:
              <input
                type="text"
                value={userData.DoctorName}
                onChange={(e) =>
                  setUserData({ ...userData, DoctorName: e.target.value })
                }
              />
            </label>
            <label>
              Admit Date:
              <input
                type="date"
                value={userData.AdmitDate}
                onChange={(e) =>
                  setUserData({ ...userData, AdmitDate: e.target.value })
                }
              />
            </label>
            <label>
              Admit ID:
              <input
                type="text"
                value={userData.AdmitID}
                onChange={(e) =>
                  setUserData({ ...userData, AdmitID: e.target.value })
                }
              />
            </label>
            <label>
              Current Progress:
              <input
                type="number"
                value={userData.CurrentProgress}
                onChange={(e) =>
                  setUserData({ ...userData, CurrentProgress: e.target.value })
                }
              />
            </label>
            <button onClick={handleAddVisitorData}>Add Visitor Data</button>
          </div>
          <button onClick={handleSaveData}>Save Data</button>
          <hr />
          <div>
            <h2>Get Visitor Data</h2>
            <label>
              Admit ID:
              <input
                type="text"
                value={admitIdForGet}
                onChange={(e) => setAdmitIdForGet(e.target.value)}
              />
            </label>
            <button onClick={handleGetVisitorData}>Get Visitor Data</button>
            <div>
              <h3>Visitor Data:</h3>
              <ul>
                {userData.VisitorData.map((visitor, index) => (
                  <li key={index}>
                    <p>Diagnosis: {visitor.Diagnosis}</p>
                    <p>
                      DiagDate:{" "}
                      {visitor.DiagDate
                        ? visitor.DiagDate.toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>Prescription: {visitor.Prescription}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {showAddVisitorModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Add Visitor Data</h2>
                <label>
                  Diagnosis:
                  <input
                    type="text"
                    value={visitorData.Diagnosis}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        Diagnosis: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Prescription:
                  <input
                    type="text"
                    value={visitorData.Prescription}
                    onChange={(e) =>
                      setVisitorData({
                        ...visitorData,
                        Prescription: e.target.value,
                      })
                    }
                  />
                </label>
                <button onClick={submitVisitorData}>Submit</button>
                <button onClick={() => setShowAddVisitorModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
