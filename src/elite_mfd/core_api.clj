(ns ^{:author "Daniel Leong"
      :doc "API calls/utils, etc. that are used in the core app"}
  elite-mfd.core-api
  (:require [cheshire.core :refer [parse-string]]
            [org.httpkit.client :as http]
            [elite-mfd.util :refer [log to-client client-error]]))

;;
;; Constants
;;
(def stations-url 
  "http://elitetradingtool.co.uk/api/EliteTradingTool/Stations?marketsOnly=true")

;;
;; Globals
;;
(defonce cached-stations (ref nil))
(defonce cached-stations-map (ref nil))

(defn parse-stations-map
  "Produce a map of SystemName->[StationName...]"
  [array]
  (reduce
    (fn [smap info]
      (let [station (:Station info)
            system-name (:System info) ]
        (assoc smap 
               system-name
               (conj (get smap system-name [])
                     station))))
    {} array))

(defn ensure-stations-cached []
  (when (nil? @cached-stations)
    (let [{:keys [status body error] :as resp} @(http/get stations-url)]
      (if error
        (log "Could not get stations:" error)
        (when-let [array (parse-string body true)]
          (dosync 
            (ref-set cached-stations array)
            (ref-set cached-stations-map (parse-stations-map array))))))))

(defn get-system-stations
  "Get the names of stations within a given system"
  [system]
  (ensure-stations-cached)
  (if-let [cached @cached-stations-map]
    (get cached system []) 
    [])) ; network issue? be graceful

(defn get-stations
  "Returns a raw array of Station info maps"
  []
  (ensure-stations-cached)
  (if-let [cached @cached-stations]
    cached 
    [])) ; network issue? be graceful 

(defn station-by-id
  "Returns the station dict by its given id"
  [id]
  ; NB if performance becomes a problem, we can certainly cache this as well...
  (first (filter 
           #(= id (:StationId %))
           (get-stations))))

(defn station-id
  "Returns the id of a station from its name"
  [station-name]
  ; NB if performance becomes a problem, we can certainly cache this as well...
  (if (nil? station-name)
    nil ; quick shortcut
    (let [pred 
          (if-let [[_ station system] (re-find #"(.*) \((.*)\)" station-name)]
            ;; system included
            #(and (= station (:Station %)) (= system (:System %)))    
            ;; just station
            #(= station-name (:Station %)))]
      (-> (filter pred (get-stations))
          first
          :StationId
          ))))

(defn system-name
  "Returns the name of a system given `Station (System)` input"
  [station-name]
  ; NB if performance becomes a problem, we can certainly cache this as well...
  (if (nil? station-name)
    "" ; quick shortcut
    (if-let [[_ station system] (re-find #"(.*) \((.*)\)" station-name)]
      ;; system included
      system
      ;; just station... use empty string
      "")))

(defn filter-systems
  "Given input, find matching system names"
  [raw-input]
  ;; NB This is not complete, since not all systems have stations.
  ;; TODO We should forward to the actual API, in case they want to
  ;;  navigate to a station-less system
  (ensure-stations-cached)
  (let [input (.toLowerCase raw-input)]
    (if-let [m @cached-stations-map]
      (->> (keys m)
           (filter #(and (not (nil? %))
                         (.contains (.toLowerCase %) input))))
      []))) ; grace 

(defn on-systems
  "System search handler"
  [ch packet]
  (if-let [q (:q packet)]
    (to-client ch {:type :systems-result
                   :q q ;; give back q to ignore old queries
                   :result (take 100 (filter-systems q))})
    (client-error ch "No query provided")))

;;
;; Registration
;;
(defn register-handlers
  "Interface used by server for registering websocket packet handlers"
  [handlers]
  (assoc handlers
         :systems on-systems))
