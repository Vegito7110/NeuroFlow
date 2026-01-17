// src/hooks/useChromeStorage.js

import { useState, useEffect } from 'react';



export function useChromeStorage(key, initialValue) {

  const [value, setValue] = useState(initialValue);



  // 1. Load from storage when component mounts

  useEffect(() => {

    if (typeof chrome !== "undefined" && chrome.storage) {

      chrome.storage.local.get([key], (result) => {

        if (result[key] !== undefined) {

          setValue(result[key]);

        }

      });

    }

  }, [key]);



  // 2. Save to storage whenever value changes

  useEffect(() => {

    if (typeof chrome !== "undefined" && chrome.storage) {

      chrome.storage.local.set({ [key]: value });

    }

  }, [key, value]);



  return [value, setValue];
}
