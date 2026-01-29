"use client";
import React, { useEffect, useState } from "react";
import api from "../lib/api";
import Link from "next/link";
import styles from "./NotificationBadge.module.css";

export default function NotificationsBadge() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/notifications");
        if (mounted && res && res.data) setItems(res.data.items || []);
      } catch (err) {
        // user unauthenticated → ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className={styles.notif}>
      <Link href="/notifications">
        {" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="#000000"
          id="Bell-Light--Streamline-Phosphor"
          height="16"
          width="16"
        >
          <desc>Bell Light Streamline Icon: https://streamlinehq.com</desc>
          <path
            d="M15.082525 11.7698625c-0.43535 -0.74916875 -1.082225 -2.86208125 -1.082225 -5.61033125 0 -4.61844375 -4.99960625 -7.50496875 -8.9993 -5.19574375C3.14474375 2.0355 2.0012375 4.01610625 2.0012375 6.15953125c0 2.74901875 -0.64764375 4.8611625 -1.08299375 5.61033125 -0.418025 0.71583125 0.0956125 1.61575625 0.92455625 1.6198625 0.00153125 0.00000625 0.00306875 0.0000125 0.0046 0.0000125h3.2674375c0.3638 2.22040625 2.99483125 3.2143375 4.73585625 1.789075 0.5506125 -0.45074375 0.917875 -1.0868625 1.032925 -1.789075h3.27051875c0.82895 -0.00175 1.34515 -0.90020625 0.9291625 -1.61721875 -0.0005125 -0.0008875 -0.00103125 -0.00176875 -0.00154375 -0.00265625Zm-7.08175625 3.15821875c-0.92646875 -0.00029375 -1.73143125 -0.6368875 -1.94523125 -1.53834375h3.8904625c-0.2138 0.90145625 -1.01876875 1.53804375 -1.94523125 1.53834375Zm6.28489375 -2.53826875c-0.025825 0.048025 -0.0762375 0.07768125 -0.13075625 0.07691875H1.8474c-0.05451875 0.0007625 -0.10493125 -0.02889375 -0.13075625 -0.07691875 -0.02748125 -0.04759375 -0.02748125 -0.1062375 0 -0.15383125 0.5822625 -0.999925 1.2076 -3.33128125 1.2076 -6.07645 0 -3.9079125 4.2304375 -6.35035625 7.6147875 -4.3964 1.5706875 0.90683125 2.5382625 2.58273125 2.5382625 4.3964 0 2.7444 0.62610625 5.07268125 1.20836875 6.07645 0.02748125 0.04759375 0.02748125 0.1062375 0 0.15383125Z"
            strokeWidth="0.0625"
          ></path>
        </svg>
        <span className={styles.badge}>
          {!loading && unread > 0 && (
            <span className={styles.badgeStyle}>{unread}</span>
          )}
        </span>
      </Link>
    </div>
  );
}
