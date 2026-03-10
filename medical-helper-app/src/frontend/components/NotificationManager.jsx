import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserReminders, updateReminder, addHistory, sendEmailNotification } from '../../firebase/firestoreService';
import toast from 'react-hot-toast';

export default function NotificationManager() {
  const { currentUser } = useAuth();
  const notifiedSet = useRef(new Set());

  // Helper to format time "14:05" to current day's Date
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, mins] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
    return d;
  };

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!currentUser) return;

    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    const checkReminders = async () => {
      try {
        const reminders = await getUserReminders(currentUser.uid);
        const now = new Date();
        const todayStr = getTodayString();

        reminders.forEach(async r => {
          // If already taken today, ignore
          if (r.lastTakenDate === todayStr) return;
          
          const reminderTime = parseTime(r.time);
          if (!reminderTime) return;

          // Check if current time is within 10 minutes past the reminder time
          const diffMs = now.getTime() - reminderTime.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);

          if (diffMinutes >= 0 && diffMinutes <= 10 && !notifiedSet.current.has(r.id + todayStr)) {
            // It's time!
            notifiedSet.current.add(r.id + todayStr);
            
            // Show system notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('MediHelper Reminder', {
                body: `It's time to take your medicine: ${r.medicineName} ${r.dosage ? `(${r.dosage})` : ''}`,
                icon: '/vite.svg', // or path to your public icon
              });
            }

            // Voice Assistant
            if ('speechSynthesis' in window) {
              const msg = new SpeechSynthesisUtterance(`Take this medicine now: ${r.medicineName}`);
              window.speechSynthesis.speak(msg);
            }

            // Email Notification Trigger
            if (currentUser?.email) {
              sendEmailNotification(currentUser.email, r);
            }

            // Always show in-app toast notification as a fallback/guarantee
            toast(`It's time to take your medicine:\n${r.medicineName} ${r.dosage ? `(${r.dosage})` : ''}`, {
              icon: '🔔',
              duration: 8000,
              style: {
                borderRadius: '16px',
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold',
              },
            });
          } else if (diffMinutes > 15 && r.lastMissedDate !== todayStr) {
            // It's past the 15 minute grace period, mark as missed!
            try {
              const docRef = await addHistory(currentUser.uid, {
                medicineName: r.medicineName,
                dosage: r.dosage || r.quantity || '1',
                status: 'missed'
              });
              await updateReminder(r.id, { 
                lastMissedDate: todayStr,
                lastMissedHistoryId: docRef.id
              });
              
              toast.error(`Missed dose logged for: ${r.medicineName}`, { icon: '⚠️', duration: 6000 });
            } catch(e) {
              console.error("Failed to log missed dose", e);
            }
          }
        });
      } catch (e) {
        console.error("Failed to fetch reminders for notifications", e);
      }
    };

    // Check immediately, then every 10 seconds to improve responsiveness
    checkReminders();
    const interval = setInterval(checkReminders, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  return null; // This is a background component
}
