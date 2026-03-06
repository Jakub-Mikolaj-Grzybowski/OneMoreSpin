import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as signalR from "@microsoft/signalr";
import '../styles/PokerLobby.css';
import '../styles/GameHeader.css';

const API_ORIGIN = new URL(import.meta.env.VITE_API_BASE).origin;

interface TableInfo {
    id: string;
    name: string;
    playersCount: number;
    minBuyIn: number;
}

export const PokerLobby = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initConnection = async () => {
            if (connectionRef.current) return;

            const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_ORIGIN}/pokerHub`, {
                    accessTokenFactory: () => localStorage.getItem("jwt") || ""
                })
                .withAutomaticReconnect()
                .build();

            connectionRef.current = newConnection;

            try {
                await newConnection.start();
                console.log("Poker Lobby: Połączono z SignalR");

                if (isMounted) {
                    setIsConnected(true);
                    const data = await newConnection.invoke("GetTables");
                    setTables(data);
                }
            } catch (err: any) {
                if (err.toString().includes("AbortError") || err.toString().includes("invocation canceled")) {
                    console.log("Poker Lobby: Połączenie anulowane.");
                } else {
                    console.error("Poker Lobby: Błąd połączenia:", err);
                }
            }
        };

        initConnection();
        return () => {
            isMounted = false;
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, []);

    const joinTable = (tableId: string) => {
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }
        navigate(`/poker/${tableId}`);
    };

    const getCardVariantClass = (tableId: string) => {
        if (tableId.includes('vip')) return 'pk-card-vip';
        if (tableId.includes('stol-2')) return 'pk-card-advanced';
        return 'pk-card-beginner';
    };

    const sortedTables = [...tables].sort((a, b) => {
        const getOrder = (id: string) => {
            if (id.includes('vip')) return 2;
            if (id.includes('stol-2')) return 1;
            return 0;
        };
        return getOrder(a.id) - getOrder(b.id);
    });

    return (
        <div className="pk-lobby-page">
            <div className="pk-lobby-bg">
                <div className="pk-lobby-shape pk-lobby-shape-1"></div>
                <div className="pk-lobby-shape pk-lobby-shape-2"></div>
                <div className="pk-lobby-shape pk-lobby-shape-3"></div>
            </div>

            <header className="game-header">
                <div className="game-header-left">
                    <button onClick={() => navigate('/poker-mode')} className="game-back-btn">
                        <i className="fas fa-arrow-left"></i>
                        <span>{t('common.back')}</span>
                    </button>
                </div>
                <div className="game-header-center">
                    <div className="game-title">
                        <span className="game-title-word">POKER</span>
                        <span className="game-title-word">LOBBY</span>
                    </div>
                </div>
                <div className="game-header-right">
                </div>
            </header>

            <div className="pk-lobby-content">
                <div className="pk-lobby-intro">
                  <p className="pk-lobby-subtitle">{t('lobby.selectTable')}</p>
                </div>

                {isConnected ? (
                    <div className="pk-tables-grid">
                        {sortedTables.map((table, index) => {
                            const variantClass = getCardVariantClass(table.id);
                            return (
                                <div 
                                    key={table.id} 
                                    className={`pk-table-card ${variantClass}`}
                                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                                >
                                    <div className="pk-card-shine"></div>
                                    <div className="pk-card-icon-bg">♠</div>
                                    
                                    <h3 className="pk-table-name">{table.name}</h3>
                                    
                                    <div className="pk-table-details">
                                        <div className="pk-detail-item">
                                            <span>👥 {t('lobby.players')}</span>
                                            <span className="pk-detail-value">{table.playersCount} / 6</span>
                                        </div>
                                        <div className="pk-detail-item">
                                            <span>💰 {t('lobby.minBuyIn')}</span>
                                            <span className="pk-detail-value">${table.minBuyIn}</span>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => joinTable(table.id)} className="pk-join-btn">
                                        {t('lobby.playNow')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="pk-loading-container">
                        <div className="pk-loading-spinner"></div>
                        <span className="pk-loading-text">{t('lobby.loadingTables')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
