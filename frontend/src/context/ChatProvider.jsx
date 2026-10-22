import {createContext, useState, useEffect, useContext} from "react";
import {useNavigate, useLocation} from "react-router-dom";

const ChatContext = createContext({ user: null, setUser: () => {} });

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

const ChatProvider = ({children}) => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("userInfo")) || null;
        } catch {
            return null;
        }
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo")) || null;
            setUser(userInfo);

            if (!userInfo && !PUBLIC_ROUTES.includes(location.pathname)) {
                navigate("/login");
            }
        } catch {
            setUser(null);
        }
    }, [location.pathname]);

    return (
        <ChatContext.Provider value={{user, setUser}}>
            {children}
        </ChatContext.Provider>
    )
};

export const ChatState = () => {
    return useContext(ChatContext);
};

export default ChatProvider;