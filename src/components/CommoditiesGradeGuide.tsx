'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, Calculator, Scale, DollarSign, ArrowRight } from 'lucide-react'

// Sample base metals pricing
const BASE_METALS = ['Gold', 'Silver', 'Copper', 'Nickel', 'Zinc', 'Lead', 'Palladium', 'Platinum', 'Lithium', 'Other']

export default function CommoditiesGradeGuide() {
    const [kgValue, setKgValue] = useState<string>('')
    const [lbValue, setLbValue] = useState<string>('')
    const [usdValue, setUsdValue] = useState<string>('')
    const [convertedCurrency, setConvertedCurrency] = useState<string>('')
    const [selectedCurrency, setSelectedCurrency] = useState('AUD')
    const [depositType, setDepositType] = useState('zinc')

    // Exchange rates
    const exchangeRates: { [key: string]: number } = {
        AUD: 1.53,
        EUR: 0.92,
        GBP: 0.79,
        CAD: 1.36,
    }

    const handleKgChange = (value: string) => {
        setKgValue(value)
        const num = parseFloat(value) || 0
        setLbValue((num * 2.20462).toFixed(4))
    }

    const handleLbChange = (value: string) => {
        setLbValue(value)
        const num = parseFloat(value) || 0
        setKgValue((num / 2.20462).toFixed(4))
    }

    const handleUsdChange = (value: string) => {
        setUsdValue(value)
        const num = parseFloat(value) || 0
        setConvertedCurrency((num * exchangeRates[selectedCurrency]).toFixed(2))
    }

    return (
        <section className="border-t border-white/10">
            {/* Hero Section */}
            <div
                className="relative h-64 flex items-center justify-start overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.5)), url(/images/mining-pit.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-geo-gold text-sm font-medium tracking-widest uppercase">TOOLS</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mt-2">
                            Investing Tools
                        </h2>
                        <h3 className="text-2xl md:text-3xl text-geo-gold font-light">
                            and Calculators
                        </h3>
                        <p className="text-gray-300 mt-4 max-w-lg">
                            Professional-grade tools for mining investment analysis, grade comparison, and unit conversion.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Calculator Preview Section */}
            <div className="bg-gradient-to-br from-geo-dark to-black py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Quick Calculator Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Left - Calculator Tools */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-geo-gold/20 text-geo-gold text-sm font-semibold rounded-lg border border-geo-gold/30">
                                            CALC LAB CONVERTER
                                        </button>
                                        <button className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-colors relative">
                                            ASSAY CONVERTER
                                            <Lock className="w-3 h-3 absolute top-1 right-1 text-geo-gold" />
                                        </button>
                                        <button className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-colors relative">
                                            GRADE COMPARISON
                                            <Lock className="w-3 h-3 absolute top-1 right-1 text-geo-gold" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Overall Information */}
                                    <div className="bg-white/5 rounded-lg border border-white/10 p-4 md:w-56">
                                        <label className="text-sm text-gray-400 block mb-2">Overall Information</label>
                                        <select
                                            value={depositType}
                                            onChange={(e) => setDepositType(e.target.value)}
                                            className="w-full bg-white text-black rounded px-3 py-2 text-sm font-medium focus:outline-none"
                                        >
                                            <option value="zinc">Zinc Deposit</option>
                                            <option value="gold">Gold Deposit</option>
                                            <option value="copper">Copper Deposit</option>
                                            <option value="nickel">Nickel Deposit</option>
                                        </select>
                                    </div>

                                    {/* Base Metals Header */}
                                    <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-4 overflow-x-auto">
                                        <div className="grid grid-cols-10 gap-2 text-xs">
                                            {BASE_METALS.map((metal, idx) => (
                                                <div key={idx} className="text-center">
                                                    <span className={idx < 6 ? 'text-geo-gold font-medium' : 'text-gray-400'}>
                                                        {metal}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-10 gap-2 text-xs mt-2">
                                            {['Au/g', 'Ag/g', 'Cu%', 'Ni%', 'Zn%', 'Pb%', 'Pd/s', 'Pt/s', 'Li%', 'Other'].map((unit, idx) => (
                                                <div key={idx} className="text-center text-gray-500">
                                                    {unit}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-10 gap-2 text-xs mt-3 text-center text-gray-400">
                                            {['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'].map((val, idx) => (
                                                <div key={idx}>{val}</div>
                                            ))}
                                        </div>

                                        {/* Equivalent Grade Row */}
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                            <div className="text-geo-gold/80 font-medium text-sm mb-2">EQUIVALENT GRADE</div>
                                            <div className="grid grid-cols-10 gap-2 text-xs text-center text-gray-400">
                                                {['Au%', 'Ag%', 'Cu%', 'Ni%', 'Zn%', 'Pb%', 'PGE', 'PGE', '-', '-'].map((val, idx) => (
                                                    <div key={idx}>{val}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right - Quick Converters */}
                            <div className="lg:w-64 space-y-4">
                                {/* Weight Converter */}
                                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Scale className="w-4 h-4 text-geo-gold" />
                                        <span className="text-sm font-medium">Kg to Lb to Tonne</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={kgValue}
                                            onChange={(e) => handleKgChange(e.target.value)}
                                            placeholder="Kg"
                                            className="w-full bg-black/50 border border-geo-gold/30 rounded px-3 py-2 text-sm text-geo-gold placeholder-gray-500 focus:outline-none focus:border-geo-gold"
                                        />
                                        <input
                                            type="number"
                                            value={lbValue}
                                            onChange={(e) => handleLbChange(e.target.value)}
                                            placeholder="Lb"
                                            className="w-full bg-black/50 border border-geo-gold/30 rounded px-3 py-2 text-sm text-geo-gold placeholder-gray-500 focus:outline-none focus:border-geo-gold"
                                        />
                                    </div>
                                </div>

                                {/* Currency Converter */}
                                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-4 h-4 text-geo-gold" />
                                        <span className="text-sm font-medium">Currency at any exchange</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedCurrency}
                                            onChange={(e) => {
                                                setSelectedCurrency(e.target.value)
                                                const num = parseFloat(usdValue) || 0
                                                setConvertedCurrency((num * exchangeRates[e.target.value]).toFixed(2))
                                            }}
                                            className="bg-geo-gold text-black rounded px-2 py-2 text-sm font-bold focus:outline-none"
                                        >
                                            <option value="AUD">$</option>
                                            <option value="EUR">€</option>
                                            <option value="GBP">£</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={usdValue}
                                            onChange={(e) => handleUsdChange(e.target.value)}
                                            placeholder="USD"
                                            className="w-full bg-black/50 border border-geo-gold/30 rounded px-3 py-2 text-sm text-geo-gold placeholder-gray-500 focus:outline-none focus:border-geo-gold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* View All Tools Button */}
                        <div className="mt-8 text-center">
                            <Link
                                href="/tools"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-geo-gold/20 to-yellow-600/10 border border-geo-gold/30 rounded-xl text-geo-gold font-semibold hover:from-geo-gold/30 hover:to-yellow-600/20 transition-all group"
                            >
                                <Calculator className="w-5 h-5" />
                                View All Tools & Grade Guides
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Pro Features Teaser */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="mt-12 bg-gradient-to-r from-geo-gold/5 to-yellow-600/5 rounded-xl border border-geo-gold/20 p-6"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-geo-gold/10 rounded-xl">
                                    <Lock className="w-6 h-6 text-geo-gold" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Unlock Pro Features</h3>
                                    <p className="text-gray-400 text-sm">Get Grade Guides, Advanced Calculators, Price Alerts & More</p>
                                </div>
                            </div>
                            <Link
                                href="/tools"
                                className="px-6 py-3 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all"
                            >
                                Subscribe Now
                            </Link>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
