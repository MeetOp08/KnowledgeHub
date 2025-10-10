// import React from "react";
// import { ArrowLeft } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import TeacherDashboard from "./TeacherDashboard";

// const TeacherLayout: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
//       {/* Teacher Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => navigate("/")}
//                 className="flex items-center text-sm text-gray-600 hover:text-gray-900"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back to Home
//               </button>
//               <h1 className="text-xl font-bold text-gray-900">Teacher Portal</h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span className="text-sm text-gray-600">Welcome, Teacher!</span>
//               <button
//                 onClick={() => {
//                   fetch('http://localhost:1234/api/auth/logout', { 
//                     method: 'POST', 
//                     credentials: 'include' 
//                   });
//                   navigate('/');
//                 }}
//                 className="text-sm text-red-600 hover:text-red-800"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <TeacherDashboard />
//     </div>
//   );
// };

// export default TeacherLayout;
