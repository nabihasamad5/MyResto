import { useEffect, useState } from "react";
export const useFormatRelativeTime = (dateInput: string): string => {
    const [relativeTime, setRelativeTime] = useState<string>("");

    useEffect(() => {
        const format = () => {
            const date = new Date(dateInput);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const seconds = Math.floor(diff / 1000);

            if (seconds < 60) {
                setRelativeTime("Just now");
                return;
            }

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) {
                setRelativeTime(minutes === 1 ? "1 min ago" : `${minutes} mins ago`);
                return;
            }

            const hours = Math.floor(minutes / 60);
            if (hours < 24) {
                setRelativeTime(hours === 1 ? "1 hour ago" : `${hours} hours ago`);
                return;
            }

            const days = Math.floor(hours / 24);
            if (days === 1) {
                setRelativeTime("1 day ago");
            } else if (days < 7) {
                setRelativeTime(`${days} days ago`);
            } else {
                const weeks = Math.floor(days / 7);
                if (weeks === 1) {
                    setRelativeTime("1 week ago");
                } else if (weeks < 4) {
                    setRelativeTime(`${weeks} weeks ago`);
                } else {
                    const months = Math.floor(days / 30);
                    if (months === 1) {
                        setRelativeTime("1 month ago");
                    } else {
                        setRelativeTime(`${months} months ago`);
                    }
                }
            }
        };

        format();
        const interval = setInterval(format, 60000); // update every minute

        return () => clearInterval(interval);
    }, [dateInput]);

    return relativeTime;
};
