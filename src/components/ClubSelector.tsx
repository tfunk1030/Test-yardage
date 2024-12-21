import React from 'react';

interface Club {
  id: string;
  name: string;
  type: string;
  loft: number;
  averageDistance: number;
}

interface ClubSelectorProps {
  selectedClub: string;
  onClubChange: (clubId: string) => void;
}

const defaultClubs: Club[] = [
  { id: 'driver', name: 'Driver', type: 'wood', loft: 10.5, averageDistance: 230 },
  { id: '3-wood', name: '3 Wood', type: 'wood', loft: 15, averageDistance: 215 },
  { id: '5-wood', name: '5 Wood', type: 'wood', loft: 18, averageDistance: 200 },
  { id: '4-iron', name: '4 Iron', type: 'iron', loft: 21, averageDistance: 180 },
  { id: '5-iron', name: '5 Iron', type: 'iron', loft: 24, averageDistance: 170 },
  { id: '6-iron', name: '6 Iron', type: 'iron', loft: 27, averageDistance: 160 },
  { id: '7-iron', name: '7 Iron', type: 'iron', loft: 31, averageDistance: 150 },
  { id: '8-iron', name: '8 Iron', type: 'iron', loft: 35, averageDistance: 140 },
  { id: '9-iron', name: '9 Iron', type: 'iron', loft: 39, averageDistance: 130 },
  { id: 'pw', name: 'Pitching Wedge', type: 'wedge', loft: 45, averageDistance: 120 },
  { id: 'gw', name: 'Gap Wedge', type: 'wedge', loft: 50, averageDistance: 110 },
  { id: 'sw', name: 'Sand Wedge', type: 'wedge', loft: 56, averageDistance: 100 },
  { id: 'lw', name: 'Lob Wedge', type: 'wedge', loft: 60, averageDistance: 90 },
];

const ClubSelector: React.FC<ClubSelectorProps> = ({ selectedClub, onClubChange }) => {
  const clubTypes = ['wood', 'iron', 'wedge'];

  return (
    <div className="space-y-6">
      {clubTypes.map(type => (
        <div key={type} className="space-y-2">
          <h3 className="text-lg font-medium text-white capitalize">{type}s</h3>
          <div className="grid grid-cols-2 gap-2">
            {defaultClubs
              .filter(club => club.type === type)
              .map(club => (
                <button
                  key={club.id}
                  onClick={() => onClubChange(club.id)}
                  className={`p-4 rounded-lg transition-all duration-300 ${
                    selectedClub === club.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{club.name}</div>
                  <div className="text-sm opacity-75">
                    {club.loft}° • ~{club.averageDistance} yds
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClubSelector;
