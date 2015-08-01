(ns ^{:author "Daniel Leong"
      :doc "Trading module based on elitetradingtool.co.uk"}
  elite-mfd.trading
  (:require [cheshire.core :refer [generate-string parse-string]]
            [org.httpkit.client :as http]
            [elite-mfd.util :refer [log to-client client-error]]  
            [elite-mfd.core-api :refer [get-stations station-id 
                                        station-by-id system-name]]))

;;
;; Constants
;;
(def calculate-url 
  "http://elitetradingtool.co.uk/api/EliteTradingTool/Calculator")
(def search-url 
  "http://elitetradingtool.co.uk/api/EliteTradingTool/Search")
(def rares-url 
  "http://elitetradingtool.co.uk/api/EliteTradingTool/RareTrades")  
;; mapping for search-stations :search-type arg value to API value
(def search-types {:buying "Station Buying"
                   :selling "Station Selling"})
;;
;; Util methods
;;
(defn filter-stations
  "Return an array of stations matching the given name
  The system name is also matched"
  [raw-input]
  (let [input (.toLowerCase raw-input)]
    (filter 
      (fn [info]
        (let [station-name (.toLowerCase (:Station info))
              system-name (.toLowerCase (:System info))]
          (or 
            (.contains station-name input)
            (.contains system-name input))))
      (get-stations))))

(defn- exists? 
  "Conveniently get a true/false value if an arg exists"
  [arg]
  (or (= true arg)
      (not (nil? arg))))

(defn- arg-value 
  "Provide a safe default value if none is provided"
  [arg]
  (if (nil? arg)
    "1"
    arg))

(defn extract-calculate-results
  [raw-json]
  (when-let [results (:Results raw-json)]
    (map 
      ;; This is a little gross, but lets us ensure a consistent API across
      ;;  different sources or changes in a chosen source. There may be a
      ;;  way to make this fancier....
      ;; We *should* abstract this stuff for all API calls....
      (fn [result]
        {:buy (-> result :Buy)
         :buyLastUpdate (-> result :BuyLastUpdate)
         :commodityName (-> result :CommodityName)
         :destSystem (-> result :DestinationSystemName)
         :destStation (-> result
                          :DestinationStationId 
                          station-by-id
                          :Station)
         :destDistanceFromJumpIn (-> result :DestinationStationDistance)
         :distance (-> result :Distance)
         :qty (-> result :Qty)
         :sell (-> result :Sell)
         :sellLastUpdate (-> result :SellLastUpdate)
         :startingStation (-> result
                              :SourceStationId
                              station-by-id
                              :Station)
         :startingSystem (-> result :SourceSystemName)
         :totalProfit (-> result :TotalProfit)})
      results)))

;;
;; API calls
;;
(defn calculate-trades
  "Call the trade calculator to request best trades
   starting at the given station and (optionally)
   ending at another station, constrained by several options.
   In particular, you should provide the :callback option if
   you hope to do anything useful with the results. The callback
   should accept a single argument which is either nil on error,
   or a vector containing suggested trades"
  [station-name-start &
   {:keys [callback cargo cash station-name-end min-profit max-distance pad-size search-range]
    :or {callback identity
         cargo 4
         cash 1000
         min-profit 500
         max-distance 1000 ; (from jump in) in Ls
         pad-size :Small
         search-range "15"}}]
  (let [request-body {:Cargo cargo
                      :Cash cash
                      :EndSystem (system-name station-name-end)
                      :EndStationId (station-id station-name-end)
                      :MaxDistanceFromJumpIn max-distance
                      :MinProfit min-profit
                      :PadSize pad-size
                      :SearchRange search-range
                      :StartSystem (system-name station-name-start)
                      :StartStationId (station-id station-name-start)}]
    (log request-body)
    (http/post 
      calculate-url
      {:timeout 1000
       :headers {"Content-Type" "application/json"}
       :body (generate-string request-body)}
      (fn [{:keys [error body]}]
        (if error
          (do 
            (log "! Error calculating:" error "Request:" request-body)
            (callback nil))
          ; parse results to a friendly format so any changes
          ;  to the service's format are transparent to clients
          (callback (extract-calculate-results (parse-string body true))))))))

(defn search-stations
  "Call the station searcher with various filters"
  [system-name &
   {:keys [callback
           allegiance-id commodity-id economy-id government-id
           has-blackmarket has-outfitting has-repairs has-shipyard
           pad-size search-type search-range]
    :or {callback identity
         pad-size :Small
         search-type :selling ; req for commodity-id
         search-range "15"}}]
  (let [request-body {:Allegiance (exists? allegiance-id)
                      :AllegianceId (arg-value allegiance-id)
                      :Blackmarket (exists? has-blackmarket)
                      :Commodity (exists? commodity-id)
                      :CommodityId (arg-value commodity-id)
                      :CurrentLocation system-name
                      :Economy (exists? economy-id)
                      :EconomyId (arg-value economy-id)
                      :FactionName ""
                      :Government (exists? government-id)
                      :GovernmentId (arg-value government-id)
                      :Outfitting (exists? has-outfitting)
                      :PadSize pad-size
                      :Rearm (exists? has-repairs)
                      :Refuel (exists? has-repairs)
                      :Repairs (exists? has-repairs)
                      :SearchRange search-range
                      :Shipyard (exists? has-shipyard)}]
    (log request-body)
    (http/post 
      search-url
      {:timeout 1000
       :headers {"Content-Type" "application/json"}
       :body (generate-string request-body)}
      (fn [{:keys [error body]}]
        (if error
          (do 
            (log "! Error searching" error "Request:" request-body)
            (callback nil))
          (callback (:Results (parse-string body true))))))))

(defn find-rares
  "Call the rare searcher based on a station"
  [system-name &
   {:keys [callback]}]
  (let [request-body {:CurrentLocation system-name}]
    (log request-body)
    (http/post 
      rares-url
      {:timeout 1000
       :headers {"Content-Type" "application/json"}
       :body (generate-string request-body)}
      (fn [{:keys [error body]}]
        (if error
          (do 
            (log "! Error searching" error "Request:" request-body)
            (callback nil))
          (callback (parse-string body true)))))))

;;
;; Packet handlers and related
;;
(defn calculate-packet-to-seq
  "Take a packet map for on-calculate and turn it into a sequence"
  [packet]
  ; should be sufficient for now
  (flatten (seq (dissoc packet :type :station-name))))

(defn on-calculate
  "Packet handler for :calculate"
  [ch packet]
  (if-let [station (:station-name packet)]
    ; NB this seems overly complicated
    (apply calculate-trades 
           (flatten (conj [station] 
                          (calculate-packet-to-seq packet)
                          :callback #(to-client ch 
                                                {:type :calculate-result
                                                 :result %}))))
    (client-error ch "Must specify starting station")))

(defn on-search
  "Packet handler for :search"
  [ch packet]
  (if-let [system (:system packet)]
    ; NB this also seems overly complicated
    (apply search-stations
           (flatten (conj [system] 
                          (calculate-packet-to-seq packet)
                          :callback #(to-client ch {:type :search-result
                                                    :result %}))))
    (client-error ch "Must specify system")))

(defn on-stations
  "Station search handler"
  [ch packet]
  (if-let [q (:q packet)]
    (to-client ch {:type :stations-result
                   :q q ;; give back q to ignore old queries
                   :result (take 100 (filter-stations q))})
    (client-error ch "No query provided")))
    
(defn on-rares
  "Rares search handler"
  [ch packet]
  (if-let [system (:system packet)]
    (apply find-rares
           (flatten (conj [system] 
                          (calculate-packet-to-seq packet)
                          :callback #(to-client ch {:type :rares-result
                                                    :result %}))))
    (client-error ch "Must specify system")))

;;
;; Registration
;;
(defn register-handlers
  "Interface used by server for registering websocket packet handlers"
  [handlers]
  (assoc handlers
         :calculate on-calculate
         :search on-search
         :stations on-stations
         :rares on-rares))
