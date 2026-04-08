'use client'

import React, { useState, useEffect } from 'react'

export default function SimpleDashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
        }
        
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        .float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="float w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🤖</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sentinel AI</h1>
              <p className="text-gray-300 text-sm">Advanced Discord Moderation Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full pulse"></div>
            <span className="text-white text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm">Total Members</p>
                <p className="text-white text-3xl font-bold">15,420</p>
                <p className="text-green-400 text-sm">↑ 12%</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm">Active Members</p>
                <p className="text-white text-3xl font-bold">8,934</p>
                <p className="text-green-400 text-sm">↑ 8%</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-xl">⚡</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm">Messages Today</p>
                <p className="text-white text-3xl font-bold">284,756</p>
                <p className="text-green-400 text-sm">↑ 15%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-xl">💬</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-300 text-sm">Violations</p>
                <p className="text-white text-3xl font-bold">1,247</p>
                <p className="text-red-400 text-sm">↓ 5%</p>
              </div>
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-red-400 text-xl">🛡️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Status & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Health Status */}
          <div className="stat-card">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-2">🏥</span>
              System Health
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">🗄️</span>
                  <span className="text-gray-300 text-sm">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span className="text-gray-400 text-sm">45ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">⚡</span>
                  <span className="text-gray-300 text-sm">Redis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span className="text-gray-400 text-sm">12ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">🤖</span>
                  <span className="text-gray-300 text-sm">Discord</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span className="text-gray-400 text-sm">89ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">🧠</span>
                  <span className="text-gray-300 text-sm">AI Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span className="text-gray-400 text-sm">234ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="stat-card lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-2">🕐</span>
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-red-400 text-sm">🛡️</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">User#1234</p>
                    <p className="text-gray-400 text-xs">Warning issued</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">2 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-400 text-sm">⚠️</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">User#5678</p>
                    <p className="text-gray-400 text-xs">Report submitted</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">5 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-sm">🎫</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">User#9012</p>
                    <p className="text-gray-400 text-xs">Ticket created</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">12 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-red-400 text-sm">🛡️</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">User#3456</p>
                    <p className="text-gray-400 text-xs">Timeout issued</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">18 minutes ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="stat-card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="mr-2">🚀</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
              <span className="block text-lg mb-2">🛡️</span>
              <span className="block font-medium">View Violations</span>
            </button>
            <button className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105">
              <span className="block text-lg mb-2">⚠️</span>
              <span className="block font-medium">Manage Reports</span>
            </button>
            <button className="p-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105">
              <span className="block text-lg mb-2">🎫</span>
              <span className="block font-medium">Support Tickets</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
