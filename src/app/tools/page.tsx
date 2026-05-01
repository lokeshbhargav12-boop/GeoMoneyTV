'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calculator, Scale, DollarSign, TrendingUp, BarChart3, Gem, ArrowLeft, Percent, Bell, Activity, Database } from 'lucide-react'

// Grade classification data
const GRADE_DATA = {
    baseMetals: {
        title: 'BASE METALS',
        items: [
            { name: 'Zinc (Mineralised)', units: '%', lowMin: '', lowMax: '1', medMin: '1', medMax: '3%', highMin: '3%', highMax: '', discovery: '8%' },
            { name: 'Lead (Disseminated)', units: '%', lowMin: '', lowMax: '1%', medMin: '1%', medMax: '2%', highMin: '2%', highMax: '', discovery: '4%' },
            { name: 'Lead (Mineralised)', units: '%', lowMin: '', lowMax: '3%', medMin: '3.5%', medMax: '6%', highMin: '6.5%', highMax: '', discovery: '10%' },
            { name: 'Copper', units: '%', lowMin: '', lowMax: '0.4%', medMin: '0.4%', medMax: '0.8%', highMin: '0.8%', highMax: '', discovery: '3%' },
            { name: 'Nickel', units: '%', lowMin: '', lowMax: '0.5%', medMin: '0.5%', medMax: '1%', highMin: '1%', highMax: '', discovery: '2%' },
            { name: 'Iron', units: '%', lowMin: '50%', lowMax: '', medMin: '58%', medMax: '60%', highMin: '60%', highMax: '', discovery: '' },
        ]
    },
    preciousMetals: {
        title: 'PRECIOUS METALS',
        items: [
            { name: 'Open Cut Gold', units: 'g/t', lowMin: '', lowMax: '0.5', medMin: '0.5', medMax: '1.5', highMin: '1.5', highMax: '', discovery: '3.0' },
            { name: 'U/G Gold', units: 'g/t', lowMin: '', lowMax: '3', medMin: '3', medMax: '6', highMin: '8', highMax: '', discovery: '30' },
            { name: 'Silver', units: 'g/t', lowMin: '', lowMax: '50', medMin: '50', medMax: '300', highMin: '300', highMax: '', discovery: '600' },
        ]
    }
}

// Rare Earth Prices Data
const RARE_EARTH_PRICES = [
    { symbol: 'La', name: 'Lanthanum', price: 4.50, change: +2.3, unit: '$/kg' },
    { symbol: 'Ce', name: 'Cerium', price: 4.20, change: -1.2, unit: '$/kg' },
    { symbol: 'Nd', name: 'Neodymium', price: 152.50, change: +5.8, unit: '$/kg' },
    { symbol: 'Pr', name: 'Praseodymium', price: 128.00, change: +3.4, unit: '$/kg' },
    { symbol: 'Dy', name: 'Dysprosium', price: 425.00, change: +8.2, unit: '$/kg' },
    { symbol: 'Tb', name: 'Terbium', price: 1650.00, change: -2.1, unit: '$/kg' },
    { symbol: 'Eu', name: 'Europium', price: 35.00, change: +0.5, unit: '$/kg' },
    { symbol: 'Y', name: 'Yttrium', price: 32.50, change: +1.8, unit: '$/kg' },
    { symbol: 'Sm', name: 'Samarium', price: 8.20, change: -0.8, unit: '$/kg' },
    { symbol: 'Gd', name: 'Gadolinium', price: 45.00, change: +2.1, unit: '$/kg' },
]

// Equivalent grade conversion factors (to Gold equivalent g/t)
const GRADE_CONVERSIONS: { [key: string]: { factor: number, unit: string } } = {
    gold: { factor: 1, unit: 'g/t' },
    silver: { factor: 0.012, unit: 'g/t' },
    copper: { factor: 1.5, unit: '%' },
    zinc: { factor: 0.4, unit: '%' },
    nickel: { factor: 2.2, unit: '%' },
    lead: { factor: 0.3, unit: '%' },
}

interface GradeTableProps {
    title: string
    items: {
        name: string
        units: string
        lowMin: string
        lowMax: string
        medMin: string
        medMax: string
        highMin: string
        highMax: string
        discovery: string
    }[]
}

function GradeTable({ title, items }: GradeTableProps) {
    return (
        <div className="mt-6">
            <div className="bg-geo-gold/20 text-geo-gold py-2 px-4 font-bold text-sm tracking-wider rounded-t-lg">
                {title}
            </div>
            <div className="bg-white/5 overflow-x-auto rounded-b-lg border border-white/10 border-t-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                            <th className="text-center py-3 px-2 text-gray-400 font-medium">Units</th>
                            <th className="text-center py-3 px-2 text-yellow-500/80 font-medium">Low</th>
                            <th className="text-center py-3 px-2 text-yellow-500 font-medium">Medium</th>
                            <th className="text-center py-3 px-2 text-green-500 font-medium">High</th>
                            <th className="text-center py-3 px-4 text-geo-gold font-medium">Discovery</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-4 text-white">{item.name}</td>
                                <td className="text-center py-2.5 px-2 text-gray-400">{item.units}</td>
                                <td className="text-center py-2.5 px-2 text-gray-300">{item.lowMax || item.lowMin}</td>
                                <td className="text-center py-2.5 px-2 text-gray-300">{item.medMin} - {item.medMax}</td>
                                <td className="text-center py-2.5 px-2 text-gray-300">{item.highMin}</td>
                                <td className="text-center py-2.5 px-4 text-geo-gold font-medium">{item.discovery}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function ToolsPage() {
    // Basic Converters State
    const [kgValue, setKgValue] = useState<string>('')
    const [lbValue, setLbValue] = useState<string>('')
    const [tonneValue, setTonneValue] = useState<string>('')
    const [usdValue, setUsdValue] = useState<string>('')
    const [convertedCurrency, setConvertedCurrency] = useState<string>('')
    const [selectedCurrency, setSelectedCurrency] = useState('EUR')
    const [depositType, setDepositType] = useState('zinc')

    // Equivalent Grade Calculator State
    const [sourceGrade, setSourceGrade] = useState<string>('')
    const [sourceMetal, setSourceMetal] = useState('copper')
    const [targetMetal, setTargetMetal] = useState('gold')
    const [equivalentGrade, setEquivalentGrade] = useState<string>('')

    // Project NPV Calculator State
    const [initialInvestment, setInitialInvestment] = useState<string>('')
    const [annualCashFlow, setAnnualCashFlow] = useState<string>('')
    const [discountRate, setDiscountRate] = useState<string>('10')
    const [projectYears, setProjectYears] = useState<string>('10')
    const [npvResult, setNpvResult] = useState<string>('')

    // Price Alert State
    const [alertMetal, setAlertMetal] = useState('gold')
    const [alertThreshold, setAlertThreshold] = useState<string>('')
    const [alertDirection, setAlertDirection] = useState('above')
    const [alerts, setAlerts] = useState<Array<{ metal: string, threshold: string, direction: string }>>([])

    // Resource Estimation State
    const [tonnage, setTonnage] = useState<string>('')
    const [grade, setGrade] = useState<string>('')
    const [recovery, setRecovery] = useState<string>('85')
    const [metalPrice, setMetalPrice] = useState<string>('')
    const [resourceResult, setResourceResult] = useState<{ contained: string, recoverable: string, value: string } | null>(null)

    // Exchange rates
    const exchangeRates: { [key: string]: number } = {
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.53,
        CAD: 1.36,
        INR: 83.12,
        JPY: 149.50,
    }

    // Weight conversion handlers
    const handleKgChange = (value: string) => {
        setKgValue(value)
        const num = parseFloat(value) || 0
        setLbValue((num * 2.20462).toFixed(4))
        setTonneValue((num / 1000).toFixed(6))
    }

    const handleLbChange = (value: string) => {
        setLbValue(value)
        const num = parseFloat(value) || 0
        setKgValue((num / 2.20462).toFixed(4))
        setTonneValue((num / 2204.62).toFixed(6))
    }

    const handleTonneChange = (value: string) => {
        setTonneValue(value)
        const num = parseFloat(value) || 0
        setKgValue((num * 1000).toFixed(2))
        setLbValue((num * 2204.62).toFixed(2))
    }

    // Currency conversion
    const handleUsdChange = (value: string) => {
        setUsdValue(value)
        const num = parseFloat(value) || 0
        setConvertedCurrency((num * exchangeRates[selectedCurrency]).toFixed(2))
    }

    const handleCurrencySelect = (currency: string) => {
        setSelectedCurrency(currency)
        const num = parseFloat(usdValue) || 0
        setConvertedCurrency((num * exchangeRates[currency]).toFixed(2))
    }

    // Equivalent Grade Calculator
    const calculateEquivalentGrade = () => {
        const gradeVal = parseFloat(sourceGrade) || 0
        const sourceConversion = GRADE_CONVERSIONS[sourceMetal]
        const targetConversion = GRADE_CONVERSIONS[targetMetal]

        if (sourceConversion && targetConversion) {
            const goldEquivalent = gradeVal * sourceConversion.factor
            const targetGrade = goldEquivalent / targetConversion.factor
            setEquivalentGrade(targetGrade.toFixed(4))
        }
    }

    // Project NPV Calculator
    const calculateNPV = () => {
        const investment = parseFloat(initialInvestment) || 0
        const cashFlow = parseFloat(annualCashFlow) || 0
        const rate = parseFloat(discountRate) / 100 || 0.1
        const years = parseInt(projectYears) || 10

        let npv = -investment
        for (let t = 1; t <= years; t++) {
            npv += cashFlow / Math.pow(1 + rate, t)
        }
        setNpvResult(npv.toFixed(2))
    }

    // Price Alert
    const addAlert = () => {
        if (!alertThreshold) return
        setAlerts([...alerts, { metal: alertMetal, threshold: alertThreshold, direction: alertDirection }])
        setAlertThreshold('')
    }

    const removeAlert = (index: number) => {
        setAlerts(alerts.filter((_, i) => i !== index))
    }

    // Resource Estimation Calculator
    const calculateResourceEstimation = () => {
        const t = parseFloat(tonnage) || 0
        const g = parseFloat(grade) || 0
        const r = (parseFloat(recovery) || 85) / 100
        const p = parseFloat(metalPrice) || 0

        const containedMetal = t * (g / 100) // tonnes
        const recoverableMetal = containedMetal * r
        const grossValue = recoverableMetal * p

        setResourceResult({
            contained: containedMetal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            recoverable: recoverableMetal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            value: grossValue.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        })
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-28 pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-geo-gold text-sm font-medium tracking-widest uppercase">TOOLS</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-2">
                            Market Analysis Tools <span className="text-geo-gold">&</span> Calculators
                        </h1>
                        <p className="text-gray-400 mt-4 max-w-2xl">
                            Informational use only. Not financial advice. Results are estimates based on assumptions and may differ from real-world outcomes.
                        </p>
                    </motion.div>
                </div>

                {/* Basic Converters */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-geo-gold" />
                        Unit Converters
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Weight Converter */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Scale className="w-5 h-5 text-geo-gold" />
                                <h3 className="text-lg font-bold">Weight Converter</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">Kilograms (kg)</label>
                                    <input type="number" value={kgValue} onChange={(e) => handleKgChange(e.target.value)} placeholder="Enter kg" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">Pounds (lb)</label>
                                    <input type="number" value={lbValue} onChange={(e) => handleLbChange(e.target.value)} placeholder="Enter lb" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">Tonnes (t)</label>
                                    <input type="number" value={tonneValue} onChange={(e) => handleTonneChange(e.target.value)} placeholder="Enter tonnes" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Currency Converter */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <DollarSign className="w-5 h-5 text-geo-gold" />
                                <h3 className="text-lg font-bold">Currency Converter</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">US Dollars (USD)</label>
                                    <input type="number" value={usdValue} onChange={(e) => handleUsdChange(e.target.value)} placeholder="Enter USD amount" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">Select Currency</label>
                                    <select value={selectedCurrency} onChange={(e) => handleCurrencySelect(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors">
                                        <option value="EUR">Euro (EUR)</option>
                                        <option value="GBP">British Pound (GBP)</option>
                                        <option value="AUD">Australian Dollar (AUD)</option>
                                        <option value="CAD">Canadian Dollar (CAD)</option>
                                        <option value="INR">Indian Rupee (INR)</option>
                                        <option value="JPY">Japanese Yen (JPY)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1.5">Converted Amount</label>
                                    <div className="w-full bg-geo-gold/10 border border-geo-gold/30 rounded-lg px-4 py-3 text-geo-gold font-semibold">
                                        {convertedCurrency || '0.00'} {selectedCurrency}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Equivalent Grade Calculator */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Percent className="w-6 h-6 text-geo-gold" />
                        Equivalent Grade Calculator
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Calculate equivalent grades across different commodities to compare deposit values accurately.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Source Metal</label>
                                <select value={sourceMetal} onChange={(e) => setSourceMetal(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors">
                                    <option value="copper">Copper (%)</option>
                                    <option value="zinc">Zinc (%)</option>
                                    <option value="nickel">Nickel (%)</option>
                                    <option value="lead">Lead (%)</option>
                                    <option value="gold">Gold (g/t)</option>
                                    <option value="silver">Silver (g/t)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Grade Value</label>
                                <input type="number" value={sourceGrade} onChange={(e) => setSourceGrade(e.target.value)} placeholder="Enter grade" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Target Metal</label>
                                <select value={targetMetal} onChange={(e) => setTargetMetal(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors">
                                    <option value="gold">Gold (g/t)</option>
                                    <option value="copper">Copper (%)</option>
                                    <option value="zinc">Zinc (%)</option>
                                    <option value="nickel">Nickel (%)</option>
                                    <option value="lead">Lead (%)</option>
                                    <option value="silver">Silver (g/t)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateEquivalentGrade} className="w-full bg-geo-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                                    Calculate
                                </button>
                            </div>
                        </div>

                        {equivalentGrade && (
                            <div className="mt-6 p-4 bg-geo-gold/10 border border-geo-gold/30 rounded-lg">
                                <div className="text-sm text-gray-400">Equivalent Grade:</div>
                                <div className="text-2xl font-bold text-geo-gold">
                                    {equivalentGrade} {GRADE_CONVERSIONS[targetMetal]?.unit}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Rare Earth Price Tracker */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Gem className="w-6 h-6 text-geo-gold" />
                        Rare Earth Price Tracker
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Track prices for rare earth elements with market insights.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {RARE_EARTH_PRICES.map((element) => (
                                <Link
                                    key={element.symbol}
                                    href={`/materials/${element.symbol}`}
                                    className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-geo-gold/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-geo-gold font-bold text-lg">{element.symbol}</span>
                                        <span className={`text-xs font-medium ${element.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {element.change >= 0 ? '+' : ''}{element.change}%
                                        </span>
                                    </div>
                                    <div className="text-white font-semibold">${element.price}</div>
                                    <div className="text-gray-500 text-xs">{element.name}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Project NPV Calculator (Analytical Tool) */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-geo-gold" />
                        Project NPV Calculator (Analytical Tool)
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Calculate Net Present Value for mining projects with customizable discount rates.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Initial Capital ($)</label>
                                <input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)} placeholder="e.g. 10000000" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Annual Cash Flow ($)</label>
                                <input type="number" value={annualCashFlow} onChange={(e) => setAnnualCashFlow(e.target.value)} placeholder="e.g. 2000000" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Discount Rate (%)</label>
                                <input type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} placeholder="e.g. 10" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Project Years</label>
                                <input type="number" value={projectYears} onChange={(e) => setProjectYears(e.target.value)} placeholder="e.g. 10" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateNPV} className="w-full bg-geo-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                                    Calculate NPV
                                </button>
                            </div>
                        </div>

                        {npvResult && (
                            <div className="mt-6 p-4 bg-geo-gold/10 border border-geo-gold/30 rounded-lg">
                                <div className="text-sm text-gray-400">Net Present Value:</div>
                                <div className={`text-2xl font-bold ${parseFloat(npvResult) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${parseFloat(npvResult).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {parseFloat(npvResult) >= 0 ? 'Project is potentially viable' : 'Project may not be viable at this discount rate'}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Price Alerts — UNLOCKED */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Bell className="w-6 h-6 text-geo-gold" />
                        Price Monitoring Alerts
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Set custom alerts for commodity price thresholds. Alerts are saved locally.
                        </p>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Commodity</label>
                                <select value={alertMetal} onChange={(e) => setAlertMetal(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors">
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                    <option value="copper">Copper</option>
                                    <option value="oil">Crude Oil</option>
                                    <option value="neodymium">Neodymium</option>
                                    <option value="lithium">Lithium</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Direction</label>
                                <select value={alertDirection} onChange={(e) => setAlertDirection(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors">
                                    <option value="above">Goes Above</option>
                                    <option value="below">Goes Below</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Price Threshold ($)</label>
                                <input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} placeholder="e.g. 2800" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={addAlert} className="w-full bg-geo-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                                    Add Alert
                                </button>
                            </div>
                        </div>

                        {alerts.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <div className="text-sm text-gray-400 mb-2">Active Alerts:</div>
                                {alerts.map((alert, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-4 h-4 text-geo-gold" />
                                            <span className="text-white font-medium capitalize">{alert.metal}</span>
                                            <span className="text-gray-400">{alert.direction === 'above' ? '↑ goes above' : '↓ goes below'}</span>
                                            <span className="text-geo-gold font-bold">${alert.threshold}</span>
                                        </div>
                                        <button onClick={() => removeAlert(idx)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Resource Estimation — UNLOCKED */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Database className="w-6 h-6 text-geo-gold" />
                        Resource Estimation Calculator
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Estimate mineral resources based on tonnage, grade, recovery rate, and commodity price.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Ore Tonnage (t)</label>
                                <input type="number" value={tonnage} onChange={(e) => setTonnage(e.target.value)} placeholder="e.g. 1000000" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Grade (%)</label>
                                <input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 1.5" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Recovery Rate (%)</label>
                                <input type="number" value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="e.g. 85" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Metal Price ($/t)</label>
                                <input type="number" value={metalPrice} onChange={(e) => setMetalPrice(e.target.value)} placeholder="e.g. 9000" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateResourceEstimation} className="w-full bg-geo-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                                    Estimate
                                </button>
                            </div>
                        </div>

                        {resourceResult && (
                            <div className="mt-6 grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-geo-gold/10 border border-geo-gold/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Contained Metal</div>
                                    <div className="text-xl font-bold text-white">{resourceResult.contained} t</div>
                                </div>
                                <div className="p-4 bg-geo-gold/10 border border-geo-gold/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Recoverable Metal</div>
                                    <div className="text-xl font-bold text-green-400">{resourceResult.recoverable} t</div>
                                </div>
                                <div className="p-4 bg-geo-gold/10 border border-geo-gold/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Estimated Gross Value</div>
                                    <div className="text-xl font-bold text-geo-gold">${resourceResult.value}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Grade Guide */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-geo-gold" />
                        Grade Guide
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <div className="mb-6">
                            <label className="text-sm text-gray-400 block mb-2">Select Deposit Type</label>
                            <select
                                value={depositType}
                                onChange={(e) => setDepositType(e.target.value)}
                                className="bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-geo-gold transition-colors min-w-[200px]"
                            >
                                <option value="zinc">Zinc Deposit</option>
                                <option value="gold">Gold Deposit</option>
                                <option value="copper">Copper Deposit</option>
                                <option value="nickel">Nickel Deposit</option>
                            </select>
                        </div>

                        <GradeTable title={GRADE_DATA.baseMetals.title} items={GRADE_DATA.baseMetals.items} />
                        <GradeTable title={GRADE_DATA.preciousMetals.title} items={GRADE_DATA.preciousMetals.items} />
                    </div>
                </motion.section>

            </div>
        </main>
    )
}
