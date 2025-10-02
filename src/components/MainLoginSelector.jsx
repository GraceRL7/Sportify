import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainLoginSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
        <style>
            {`
                /* MainLoginSelector.css - Embedded for Canvas compatibility */
                
                :root {
                    --primary-color: #30D5C8; /* Teal */
                    --secondary-color: #20143b; /* Dark Blue */
                    --dark-text: #333333;
                    --medium-text: #555555;
                    --clean-white: #ffffff;
                    --error-red: #dc3545;
                    --success-green: #28a745;
                    --warning-orange: #ffc107;
                }

                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: var(--secondary-color);
                    padding: 20px;
                    box-sizing: border-box;
                }

                .login-box {
                    background-color: var(--clean-white);
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                    text-align: center;
                    width: 100%;
                    max-width: 400px;
                    box-sizing: border-box;
                }

                .login-header {
                    margin-bottom: 30px;
                    color: var(--secondary-color);
                    font-size: 2em;
                    font-weight: 700;
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    gap: 15px; /* Spacing between buttons */
                }

                .role-button {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1em;
                    cursor: pointer;
                    font-weight: 600;
                    text-transform: uppercase;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .role-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }

                /* Player/User Button Style */
                .role-button.player {
                    background: linear-gradient(135deg, var(--primary-color) 0%, #0072ff 100%);
                    color: var(--clean-white);
                }
                .role-button.player:hover {
                    background: linear-gradient(135deg, #27c2b6 0%, #005bb7 100%);
                }
                
                /* Coach Button Style (using a success green theme) */
                .role-button.coach {
                    background-color: var(--success-green);
                    color: var(--clean-white);
                }
                .role-button.coach:hover {
                    background-color: #1e7e34;
                }

                /* Admin Button Style (using a warning/danger red theme) */
                .role-button.admin {
                    background-color: var(--error-red);
                    color: var(--clean-white);
                }
                .role-button.admin:hover {
                    background-color: #bd2130;
                }
                
                /* Responsive */
                @media (max-width: 600px) {
                    .login-box {
                        padding: 30px 20px;
                    }
                    .login-header {
                        font-size: 1.8em;
                    }
                }
            `}
        </style>
      <div className="login-box">
        <div className="login-header">Login As</div>
        <div className="button-group">
          <button
            onClick={() => navigate('/player/login')}
            className="role-button player"
          >
            Player Login
          </button>
          <button
            onClick={() => navigate('/coach/login')}
            className="role-button coach"
          >
            Coach Login
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="role-button admin"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainLoginSelector;
