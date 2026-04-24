import { useState, useEffect, useCallback } from 'react';
export function useFirstVisit(key = 'hasSeenTour') {
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    useEffect(() => {
        const seen = localStorage.getItem(key);
        if (!seen)
            setIsFirstVisit(true);
    }, [key]);
    const markAsSeen = useCallback(() => {
        localStorage.setItem(key, 'true');
        setIsFirstVisit(false);
    }, [key]);
    return { isFirstVisit, markAsSeen };
}
