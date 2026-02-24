/** 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

type Role = 'Donor' | 'Organization' | 'Admin';

export default function app() {
    const [role, setRole] = useState < Role > ('Donor');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const roles: Role[] = ['Donor', 'Organization', 'Admin'];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
            >
                <div className="p-8 pb-10">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Register</h1>
                        <p className="text-slate-500 text-lg">Join the Chomnuoy community today</p>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-8">
                        <p className="text-center font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">I am joining as a...</p>
                        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                            {roles.map((r) =>(
                                <button 
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={``}
                                >

                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}