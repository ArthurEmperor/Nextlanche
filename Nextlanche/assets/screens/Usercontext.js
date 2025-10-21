import React, { createContext, useState, useContext } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [saldo, setSaldo] = useState(0);

  return (
    <UserContext.Provider value={{ user, setUser, saldo, setSaldo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);