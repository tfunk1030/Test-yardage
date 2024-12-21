import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface Shot {
  id?: number;
  club: string;
  distance: number;
  conditions: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
  };
  timestamp: number;
}

interface StorageContextType {
  saveShot: (shot: Omit<Shot, 'id' | 'timestamp'>) => Promise<void>;
  getShots: () => Promise<Shot[]>;
  clearShots: () => Promise<void>;
  error: string | null;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

const DB_NAME = 'GolfCalculatorDB';
const SHOT_STORE = 'shots';

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB(DB_NAME, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(SHOT_STORE)) {
              db.createObjectStore(SHOT_STORE, { 
                keyPath: 'id', 
                autoIncrement: true 
              });
            }
          },
        });
        setDb(database);
      } catch (err) {
        setError('Failed to initialize database');
        console.error('Database initialization error:', err);
      }
    };

    initDB();
  }, []);

  const saveShot = async (shot: Omit<Shot, 'id' | 'timestamp'>) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.add(SHOT_STORE, {
        ...shot,
        timestamp: Date.now()
      });
    } catch (err) {
      setError('Failed to save shot');
      console.error('Shot save error:', err);
    }
  };

  const getShots = async () => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      return await db.getAll(SHOT_STORE);
    } catch (err) {
      setError('Failed to retrieve shots');
      console.error('Shot retrieval error:', err);
      return [];
    }
  };

  const clearShots = async () => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.clear(SHOT_STORE);
    } catch (err) {
      setError('Failed to clear shots');
      console.error('Shot clear error:', err);
    }
  };

  return (
    <StorageContext.Provider value={{ saveShot, getShots, clearShots, error }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
