import React from 'react';
import { Book, FileText, HelpCircle, Search } from 'lucide-react';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const docs = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using the task management system',
      icon: Book,
      sections: [
        'System Overview',
        'Creating Your First Task',
        'Team Management',
        'Basic Navigation',
      ],
    },
    {
      title: 'Task Management',
      description: 'Detailed guide on managing tasks and workflows',
      icon: FileText,
      sections: [
        'Creating Tasks',
        'Assigning Tasks',
        'Setting Priorities',
        'Task Statuses',
        'Adding Comments',
      ],
    },
    {
      title: 'Team Collaboration',
      description: 'Best practices for team collaboration',
      icon: HelpCircle,
      sections: [
        'Team Roles',
        'Communication Tools',
        'Sharing Resources',
        'Access Control',
      ],
    },
  ];

  const filteredDocs = docs.filter(
    doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sections.some(section =>
        section.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
      </div>

      <div className="mb-8">
        <div className="max-w-xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.title}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {doc.description}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="space-y-4">
                    {doc.sections.map((section) => (
                      <button
                        key={section}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}