<?php

class Feeds
{
	private static $singleton = null;

	public static function getInstance()
	{
		if (self::$singleton == null)
			self::$singleton = new Feeds();
		return self::$singleton;
	}

	private $feedsPath;
	private $feedsList;

	private function __construct()
	{
		$config = Configuration::getInstance();
		$this->feedsPath = $config->getConfig('settingspath').'/blog-feeds.json';
		$this->feedsList = $this->_getFeeds();
	}

	/* Load the feeds array from the feeds json file
	 */
	private function _getFeeds()
	{
		if (file_exists($this->feedsPath))
		{
			$data = file_get_contents($this->feedsPath);
			return empty($data) ? array() : json_decode($data);
		}
		else
		{
			return array();
		}
	}

	/* Load the feeds array from the feeds json file
	 */
	public function getFeeds()
	{
		return $this->feedsList;
	}

	/**
	 * returns an array of all valid URLs
	 */
	public function getValidURLs()
	{
		$urls = array();
		foreach($this->feedsList as $feed)
		{
			if($feed->checked && $feed->valid)
			{
				$urls[] = $feed->url;
			}
		}
		return array_unique($urls);
	}

	/* Save the feeds array to the feeds json file
	 */
	public function putFeeds($feeds)
	{
		$this->feedsList = $feeds;
		return file_put_contents($this->feedsPath, json_encode($this->feedsList));
	}

	public function findFeed($key, $value)
	{
		foreach ($this->feedsList as $feed)
		{
			if ($feed->$key == $value)
			{
				return $feed;
			}
		}
		return null;
	}

	/**
	 * Gets the most recent three post from an RSS feed
	 */
	public static function getRecentPosts($url, $howMany)
	{
		return array();
	}

	/**
	 * Gets an object representing the requested RSS
	 */
	public static function getRSS($url)
	{
		return new StdClass();
	}


}
