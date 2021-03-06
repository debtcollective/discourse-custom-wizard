class CustomWizard::Log
  include ActiveModel::Serialization
  
  attr_accessor :message, :date
    
  PAGE_LIMIT = 100
  
  def initialize(attrs)
    @message = attrs['message']
    @date = attrs['date']
  end
  
  def self.create(message)
    log_id = SecureRandom.hex(12)
    
    PluginStore.set('custom_wizard_log',
      log_id.to_s,
      {
        date: Time.now,
        message: message
      }
    )
  end
  
  def self.list_query
    PluginStoreRow.where("
      plugin_name = 'custom_wizard_log' AND
      (value::json->'date') IS NOT NULL
    ").order("value::json->>'date' DESC")
  end
  
  def self.list(page = 0)
    self.list_query.limit(PAGE_LIMIT)
      .offset(page * PAGE_LIMIT)
      .map { |r| self.new(JSON.parse(r.value)) }
  end
end