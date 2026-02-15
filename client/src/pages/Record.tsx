
import React from 'react';
import Recorder from '../components/Recorder';

export default function RecordPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">New Recording</h1>
            <Recorder />
        </div>
    );
}
