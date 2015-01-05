(ns elite-mfd.core
  (:require [clojure.tools.nrepl.server :refer [start-server stop-server]]
            [clojure.data.xml :refer [parse emit]]
            [clojure.zip :refer [xml-zip root edit node]]
            [clojure.data.zip.xml :as c-d-z-xml
             :refer [xml-> xml1-> attr attr= text]]
            [clojure.java.io :refer [file reader writer]]
            [elite-mfd.server :refer [create-server set-system]])
  (:import  [java.io RandomAccessFile])
  (:gen-class))

;
; Config
;
; FIXME actual path
(def product-root (file (System/getProperty "user.home") "Desktop"))
(def server-port 9876)
(def nrepl-port 7888)

;
; Constants
;
(def product-name "FORC-FDEV-D-1010")
(def product-dir (file product-root product-name))
(def app-config-path (file product-dir "AppConfig.xml"))
(def app-config-backup-path (file product-dir "AppConfig.xml.bak"))
(def logs-dir (file product-dir "Logs"))

(defn- log [& msg]
  (apply println msg))

(defn fix-config-reader [in]
  "Ensure the AppConfig.xml file is fixed.
   Returns nil if it's good, else the root Element with the attribute added"
  (let [z (xml-zip (parse in))
        network (xml1-> z :Network)
        verbose (attr network :VerboseLogging)]
    (when (or (nil? verbose) (= "0" verbose))
      (root
        (edit network #(assoc-in % [:attrs :VerboseLogging] "1"))))))

(defn- fix-config []
  "Ensure the AppConfig.xml file is fixed"
  (when-let [el (with-open [in (reader app-config-path)]
                (fix-config-reader in))]
    ; backup the file...
    (spit app-config-backup-path (slurp app-config-path))
    ; ... because our replacement trashes the formatting
    (with-open [out (writer app-config-path)]
      (emit el out))))

(defn pick-log-file []
  "Pick most recent netLog file"
  (let [netlogs (filter #(-> %
                             (.getName)
                             (.startsWith "netLog"))
                        (file-seq logs-dir))]
    (-> netlogs
        sort
        last)))

(defn- raf-seq
  [#^RandomAccessFile raf]
  (if-let [line (.readLine raf)]
    (lazy-seq (cons line (raf-seq raf)))
    (do (Thread/sleep 1000)
        (recur raf))))

(defn- tail-seq [input]
  (let [raf (RandomAccessFile. input "r")]
    (raf-seq raf)))

(defn system-poller [pred]
  "Polls for changes in the system 
  and calls the predicate when it changed"
  (let [in (pick-log-file)]
    (log "Reading " (.getAbsolutePath in))
    (doseq [line (tail-seq in)]
      ; TODO extract system name from line
      (pred line))))

(defn -main
  "I don't do a whole lot ... yet."
  [& args]
  ; make sure we're config'd correctly
  (fix-config)
  (log "Starting")
  (defonce nrepl-server (start-server :port nrepl-port))
  (let [server (create-server server-port)
        system-callback #(set-system server %)
        system-poll-future (future (system-poller system-callback))]
    @system-poll-future
    ))

;; (-main)
