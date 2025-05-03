import React from 'react';

const AppHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <h1 className="text-2xl font-bold text-gray-900">HT Resume Analyzer</h1>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 mr-4">HR Department</span>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <span className="text-sm font-medium">HR</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
