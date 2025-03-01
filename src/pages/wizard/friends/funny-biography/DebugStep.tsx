import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const DebugStep = () => {
  const [localStorageItems, setLocalStorageItems] = useState<{key: string, value: string}[]>([]);
  const [filteredItems, setFilteredItems] = useState<{key: string, value: string}[]>([]);
  const [filter, setFilter] = useState("funny");

  useEffect(() => {
    // Get all localStorage items
    const items: {key: string, value: string}[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        items.push({ key, value });
      }
    }
    setLocalStorageItems(items);
    
    // Apply initial filter
    filterItems(items, filter);
  }, []);

  const filterItems = (items: {key: string, value: string}[], filterText: string) => {
    const filtered = items.filter(item => 
      item.key.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    filterItems(localStorageItems, newFilter);
  };

  const formatValue = (value: string) => {
    try {
      // Try to parse as JSON for prettier display
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If not valid JSON, return as is
      return value;
    }
  };

  const clearLocalStorageItem = (key: string) => {
    localStorage.removeItem(key);
    // Update the state
    const updatedItems = localStorageItems.filter(item => item.key !== key);
    setLocalStorageItems(updatedItems);
    filterItems(updatedItems, filter);
  };

  return (
    <WizardStep
      title="Debug Information"
      description="View all localStorage data for debugging purposes"
      previousStep="/create/friends/funny-biography/ideas"
      nextStep="/create/friends/funny-biography/photos"
      currentStep={3}
      totalSteps={6}
    >
      <div className="glass-card rounded-2xl p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex gap-2 mb-4">
            <Button 
              variant={filter === "funny" ? "default" : "outline"}
              onClick={() => handleFilterChange("funny")}
            >
              Funny Biography
            </Button>
            <Button 
              variant={filter === "" ? "default" : "outline"}
              onClick={() => handleFilterChange("")}
            >
              All Items
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirm("Clear all localStorage items?")) {
                  localStorage.clear();
                  setLocalStorageItems([]);
                  setFilteredItems([]);
                }
              }}
            >
              Clear All
            </Button>
          </div>

          <ScrollArea className="h-[500px] rounded-md border p-4">
            {filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.key} className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{item.key}</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => clearLocalStorageItem(item.key)}
                      >
                        Delete
                      </Button>
                    </div>
                    <pre className="mt-2 bg-muted p-2 rounded-md text-sm overflow-x-auto">
                      {formatValue(item.value)}
                    </pre>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No localStorage items found with the current filter.
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </WizardStep>
  );
};

export default DebugStep;
