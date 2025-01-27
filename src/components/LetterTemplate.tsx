import React from 'react';
import { LetterTemplateProps } from '../types';
import { Users, Calendar, Mail, MapPin, Quote, CheckCircle2, Award } from 'lucide-react';

export const LetterTemplate: React.FC<LetterTemplateProps> = ({ letter, position }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative">      
      <div className="letter-content max-w-4xl mx-auto bg-white p-8 shadow-lg border border-green-100 rounded-lg print:shadow-none print:border-none print:p-4">
        {/* Letterhead */}
        <div className="border-b-2 border-green-500 pb-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Award className="w-16 h-16 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-700">MCAN</h1>
                <p className="text-sm text-green-600">Muslim Corpers' Association of Nigeria</p>
                <p className="text-sm text-green-600">FCT Chapter</p>
              </div>
            </div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/8/87/NYSC_LOGO.svg" 
              alt="NYSC Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          
          <div className="space-y-2 text-gray-600 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <p>NYSC Permanent Orientation Camp, Kubwa, Bwari Area Council, FCT Abuja</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
              <p>Email: mcanictng@gmail.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-green-700 italic border-t border-green-200 pt-3 text-sm">
            <Quote className="w-4 h-4" />
            <p>Motto: 'Say, Truly, my prayer and my service, my life and my death, (all) for Allah, the Cherisher of the Worlds'</p>
          </div>

          <div className="flex justify-between mt-3 text-sm text-gray-600">
            <p className="font-medium">Batch: {letter.batch}</p>
            <div>
              <p className="font-medium">Reference: {letter.referenceNumber}</p>
              <p>{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Recipient Details */}
        <div className="mb-6">
          <p className="font-medium text-gray-800 text-lg">{letter.recipientName}</p>
          <p className="mt-3">Dear {letter.recipientName.split(' ')[0]},</p>
        </div>

        {/* Appointment Details */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2 print:text-green-700">
            <Users className="w-5 h-5 print:text-green-700" />
            Appointment as {position.title}
          </h2>

          <p className="text-gray-700 leading-relaxed">
            I am pleased to inform you of your appointment as {position.title} of the Muslim
            Corpers' Association of Nigeria (MCAN). This appointment is effective from{' '}
            <span className="font-medium">{letter.startDate}</span> to{' '}
            <span className="font-medium">{letter.endDate}</span>.
          </p>

          {/* Duties Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-700 mb-3">Key Responsibilities:</h3>
            <ul className="space-y-2">
              {position.duties.map((duty, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{duty}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Standard Sections */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Code of Conduct:</h3>
              <p className="text-gray-700">
                As a representative of MCAN, you are expected to maintain the highest
                standards of Islamic ethics and professional conduct at all times.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-green-700 mb-2">Confidentiality:</h3>
              <p className="text-gray-700">
                You are required to maintain strict confidentiality regarding all MCAN
                matters and sensitive information accessed during your tenure.
              </p>
            </div>
          </div>

          {/* Signature Block */}
          <div className="mt-8 space-y-8">
            <div>
              <p>Yours sincerely,</p>
              <div className="mt-8 space-y-1">
                <div className="w-48 h-16 border border-green-100 rounded-md mb-2"></div>
                <p className="font-semibold text-green-700 print:text-green-700">Chairman, Shurah Committee</p>
                <p>MCAN</p>
              </div>
            </div>

            <div className="border-t border-green-200 pt-6">
              <p className="font-semibold text-green-700 mb-3">Acceptance of Appointment</p>
              <p className="text-gray-700">
                I, {letter.recipientName}, accept this appointment and agree to fulfill
                the duties and responsibilities as outlined above.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <div className="w-48 h-16 border border-green-100 rounded-md"></div>
                  <p className="text-sm text-gray-600">Signature</p>
                </div>
                <div className="space-y-1">
                  <div className="w-48 h-8 border border-green-100 rounded-md"></div>
                  <p className="text-sm text-gray-600">Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};