import React from 'react';

const RoutineSchedule = ({ routineSchedule }) => {
  if (!routineSchedule) {
    return null;
  }

  const { dailyRoutine, weeklyRoutine } = routineSchedule;

  // Icon components for different routine steps
  const getStepIcon = (stepText) => {
    const text = stepText.toLowerCase();
    
    if (text.includes('shampoo') || text.includes('cleansing') || text.includes('wash')) {
      return '🧴'; // Shampoo bottle
    } else if (text.includes('condition') || text.includes('conditioner')) {
      return '💧'; // Water droplet
    } else if (text.includes('oil') || text.includes('serum')) {
      return '🌿'; // Herb/oil
    } else if (text.includes('mask') || text.includes('treatment')) {
      return '✨'; // Sparkles for treatments
    } else if (text.includes('dry') || text.includes('towel')) {
      return '🏺'; // Towel/drying
    } else if (text.includes('brush') || text.includes('comb')) {
      return '🪮'; // Comb
    } else if (text.includes('style') || text.includes('heat')) {
      return '💨'; // Wind for styling
    } else if (text.includes('scalp') || text.includes('massage')) {
      return '👆'; // Finger for massage
    } else {
      return '📝'; // Default note icon
    }
  };

  const getTimeIcon = (isDaily) => {
    return isDaily ? '☀️' : '📅';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-250 border border-purple-100">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
        <span className="mr-3 text-2xl">📋</span>
        Your Personalized Hair Care Schedule
      </h2>
      <p className="text-gray-600 mb-6">Follow this detailed schedule to achieve your best hair health. Each step is tailored specifically for your hair type and concerns.</p>

      {/* Daily Routine Section */}
      {(dailyRoutine?.morning?.length > 0 || dailyRoutine?.evening?.length > 0) && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
            <span className="mr-2 text-xl">{getTimeIcon(true)}</span>
            Daily Routine
          </h3>

          {/* Morning Routine */}
          {dailyRoutine?.morning?.length > 0 && (
            <div className="mb-6 bg-white bg-opacity-60 p-4 rounded-lg border border-purple-100">
              <h4 className="text-lg font-medium mb-3 flex items-center text-purple-600">
                <span className="mr-2">🌅</span>
                Morning Routine
              </h4>
              <div className="space-y-3">
                {dailyRoutine.morning.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-medium text-yellow-700">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 text-xl">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evening Routine */}
          {dailyRoutine?.evening?.length > 0 && (
            <div className="mb-6 bg-white bg-opacity-60 p-4 rounded-lg border border-purple-100">
              <h4 className="text-lg font-medium mb-3 flex items-center text-purple-600">
                <span className="mr-2">🌙</span>
                Evening Routine
              </h4>
              <div className="space-y-3">
                {dailyRoutine.evening.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 text-xl">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Routine Section */}
      {(weeklyRoutine?.washDays?.steps?.length > 0 || 
        weeklyRoutine?.treatments?.deepConditioning || 
        weeklyRoutine?.treatments?.scalpCare || 
        weeklyRoutine?.treatments?.specialTreatments) && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
            <span className="mr-2 text-xl">{getTimeIcon(false)}</span>
            Weekly Routine
          </h3>

          {/* Wash Days */}
          {weeklyRoutine?.washDays?.steps?.length > 0 && (
            <div className="mb-6 bg-white bg-opacity-60 p-4 rounded-lg border border-purple-100">
              <h4 className="text-lg font-medium mb-3 flex items-center text-purple-600">
                <span className="mr-2">🚿</span>
                Wash Days
                {weeklyRoutine.washDays.frequency && (
                  <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {weeklyRoutine.washDays.frequency}
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {weeklyRoutine.washDays.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-sm font-medium text-teal-700">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 text-xl">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Treatments */}
          {(weeklyRoutine?.treatments?.deepConditioning || 
            weeklyRoutine?.treatments?.scalpCare || 
            weeklyRoutine?.treatments?.specialTreatments) && (
            <div className="bg-white bg-opacity-60 p-4 rounded-lg border border-purple-100">
              <h4 className="text-lg font-medium mb-3 flex items-center text-purple-600">
                <span className="mr-2">💆‍♀️</span>
                Weekly Treatments
              </h4>
              <div className="space-y-4">
                {weeklyRoutine.treatments.deepConditioning && (
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="flex-shrink-0 text-xl">✨</div>
                    <div className="flex-1">
                      <h5 className="font-medium text-green-700 mb-1">Deep Conditioning</h5>
                      <p className="text-gray-700 leading-relaxed">{weeklyRoutine.treatments.deepConditioning}</p>
                    </div>
                  </div>
                )}
                
                {weeklyRoutine.treatments.scalpCare && (
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                    <div className="flex-shrink-0 text-xl">👆</div>
                    <div className="flex-1">
                      <h5 className="font-medium text-pink-700 mb-1">Scalp Care</h5>
                      <p className="text-gray-700 leading-relaxed">{weeklyRoutine.treatments.scalpCare}</p>
                    </div>
                  </div>
                )}
                
                {weeklyRoutine.treatments.specialTreatments && (
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                    <div className="flex-shrink-0 text-xl">🌟</div>
                    <div className="flex-1">
                      <h5 className="font-medium text-amber-700 mb-1">Special Treatments</h5>
                      <p className="text-gray-700 leading-relaxed">{weeklyRoutine.treatments.specialTreatments}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pro Tips Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <h4 className="text-lg font-medium mb-2 flex items-center text-indigo-700">
          <span className="mr-2">💡</span>
          Pro Tips for Success
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Set reminders on your phone for each routine step</li>
          <li>• Keep all your products organized in one place</li>
          <li>• Take progress photos weekly to track improvements</li>
          <li>• Adjust timing based on your lifestyle and schedule</li>
        </ul>
      </div>
    </div>
  );
};

export default RoutineSchedule;
