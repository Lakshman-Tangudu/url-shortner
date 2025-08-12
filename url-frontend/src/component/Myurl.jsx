import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { useAuth } from '@clerk/clerk-react';
import QRGenerator from './QrCode';
import trash from '../assets/trash.png'; 
function Myurl() {
    const { getToken } = useAuth();
    const [urls, setUrls] = useState({
        data: null,
        isLoading: true
    });

    useEffect(() => {
        getData();
    }, []);

    async function getData() {
        try {
            const token = await getToken();
            if (!token) {
                console.error('No token available - user might be signed out');
                setUrls({ data: [], isLoading: false });
                return;
            }
                const response = await fetch(`${process.env.VITE_APP_API_URL}/api/getdata`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.data) {
                console.error('No data field in response');
                throw new Error('Invalid response format');
            }

            const urlArray = result.data.map(item => ({
                short: item.short_url,
                original: item.long_url
            }));

            setUrls({ data: urlArray, isLoading: false });
        } catch (err) {
            console.error('Error in getData:', err); 
            setUrls({ data: [], isLoading: false });
        }
    }

    async function handledelete(item) {
        const token = await getToken(); 
        if (!token) {
            console.error('No token available - user might be signed out');
            setUrls({ data: [], isLoading: false });
            return;
        }

        const result = await fetch(`${process.env.VITE_APP_API_URL}/api/deletedata`, {
            method: 'PUT',
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ item })
        })
        const data = await result.json();
        getData();
    }

    return (
        <div>
            {urls.isLoading
                ? <div className="flex justify-center items-center text-center mx-auto text-blue-600 text-lg border  border-gray-300 rounded-lg shadow-lg p-4 max-w-screen-lg h-20 my-60">loading...</div>
                : (
                    urls.data && urls.data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 my-8 ">
                            {urls.data.map((item, index) => (
                                <div key={index} className="border border-gray-300 p-4 rounded-lg shadow-lg w-11/12 mx-auto my-4 space-y-2">
                                    <div className="flex justify-between">
                                        <div className="flex-col space-y-2">
                                            <div className="break-all flex">
                                                <div>
                                                    <p><strong>Short URL:</strong></p> <a href={item.short} target="_blank" rel="noopener noreferrer" className="text-gray-400">{item.short}</a>
                                                </div>
                                                <div className="flex place-items-end">
                                                    <button className="ml-4 bg-white text-black rounded-lg mt-4" onClick={() => navigator.clipboard.writeText(item.short)}><Copy className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                            <div className="break-all">
                                                <p><strong>Original URL:</strong></p> <a href={item.original} target="_blank" rel="noopener noreferrer" className="text-gray-400">{item.original}</a>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <QRGenerator url={item.original} />
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={() => handledelete(item)}><img src={trash} alt="delete" className="w-7 h-7"></img></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center text-center mx-auto text-blue-600 text-lg border  border-gray-300 rounded-lg shadow-lg p-4 max-w-screen-lg h-20 my-60">
                            <div>No data found.</div>
                        </div>
                    )
                )
            }
        </div>
    );
}

export default Myurl;