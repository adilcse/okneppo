  // Helper component for status button with count
  const StatusButton = ({ 
    status, 
    label, 
    count, 
    activeColor, 
    inactiveColor,
    isLoading = false,
    statusFilter,
    handleStatusFilter,
  }: { 
    status: 'all' | 'pending' | 'completed' | 'failed' | 'cancelled';
    label: string;
    count: number;
    activeColor: string;
    inactiveColor: string;
    isLoading?: boolean;
    statusFilter: 'all' | 'pending' | 'completed' | 'failed' | 'cancelled';
    handleStatusFilter: (status: 'all' | 'pending' | 'completed' | 'failed' | 'cancelled') => void;
  }) => (
    <button
      onClick={() => handleStatusFilter(status)}
      className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center gap-2 ${
        statusFilter === status
          ? activeColor
          : inactiveColor
      }`}
    >
      <span>{label}</span>
      {isLoading ? (
        <div className={`w-6 h-4 rounded-full animate-pulse ${
          statusFilter === status
            ? 'bg-white/30'
            : 'bg-gray-400'
        }`} />
      ) : (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          statusFilter === status
            ? 'bg-white/20 text-white'
            : 'bg-gray-500 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  export default StatusButton;