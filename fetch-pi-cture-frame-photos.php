#!/usr/bin/env php
<?php
date_default_timezone_set( 'America/Los_Angeles' );
define( 'DISPLAY_WIDTH', 800 );
define( 'DISPLAY_HEIGHT', 480 );

chdir( __DIR__ . '/www' );

$url_file = __DIR__ . '/.picasaweb-feed-url';

if ( ! file_exists( $url_file ) ) {
	echo "URL file does not exist: $url_file\n";
	exit( 1 );
}
$picasaweb_feed_url = trim( file_get_contents( $url_file ) );
if ( empty( $picasaweb_feed_url ) ) {
	echo "Config lacks picasaweb_feed_url\n";
	exit( 1 );
}

list( $url, $query_string ) = explode( '?', $picasaweb_feed_url );
parse_str( $query_string, $query_vars );
$query_vars['alt'] = 'json';
$query_vars['imgdl'] = '1';
$query_string = http_build_query( $query_vars );
$picasaweb_feed_url = $url . '?' . $query_string;

if ( ! file_exists( __DIR__ . '/www/photo-cache' ) ) {
	mkdir( __DIR__ . '/www/photo-cache' );
}

$cached_feed_file = '/tmp/pi-cture-frame-feed-cached.json';
if ( ! file_exists( $cached_feed_file ) || time() - filemtime( $cached_feed_file ) > 60 ) {
	$feed_json = file_get_contents( $picasaweb_feed_url );
	if ( empty( $feed_json ) ) {
		echo "Unable to fetch feed.\n";
		exit( 1 );
	}
	$data = json_decode( $feed_json, true );
	if ( empty( $data ) ) {
		echo "Unable to parse feed.\n";
		exit( 1 );
	}
	file_put_contents( $cached_feed_file, json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
} else {
	$data = json_decode( file_get_contents( $cached_feed_file ), true );
}

// @todo Check if we need to paginate.

$photo_cache_dir = __DIR__ . '/www/photo-cache/';

$photo_manifest = array();

foreach ( $data['feed']['entry'] as $i => $entry ) {
	printf( "Processing %d of %d...\n", $i + 1, count( $data['feed']['entry'] ) );

	if ( 'image/jpeg' !== $entry['content']['type'] ) {
		echo sprintf( "Skipping unsupported type for %s\n", $entry['id']['$t'] );
		continue;
	}

	$cache_file = sprintf( 'photo-cache/%s.jpg', md5( $entry['id']['$t'] ) );
	$entry['id'] = $entry['id']['$t'];
	$entry['local_src'] = $cache_file;

	if ( ! file_exists( $cache_file ) ) {
		system( sprintf( 'wget -O %s %s', escapeshellarg( $cache_file ), escapeshellarg( $entry['content']['src'] ) ) );
		system( sprintf(
			'convert %s -resize %dx%d\> %s',
			$cache_file,
			max( DISPLAY_WIDTH, DISPLAY_HEIGHT ),
			max( DISPLAY_WIDTH, DISPLAY_HEIGHT ),
			$cache_file
		) );
	}

	// Parse the datetime out of the metadata. For some reason it is not presented in a machine-readable form.
	$entry['datetime'] = null;
	if ( preg_match( '/\w(?P<month>\w+) (?P<day>\d+), (?P<year>\d\d\d\d), (?P<hour>\d+):\d\d (AM|PM)/', $entry['summary']['$t'], $matches ) ) {
		$entry['datetime'] = date( 'c', strtotime( $matches[0] . ' GMT' ) );
	} else {
		// @todo Fallback to looking at the filename.
	}
	$photo_manifest[] = $entry;
}

usort( $photo_manifest, function ( $a, $b ) {
	return strcmp( $a['datetime'], $b['datetime'] );
} );

$manifest_file = __DIR__ . '/www/photo-cache/manifest.json';
echo "Writing to $manifest_file\n";
file_put_contents( $manifest_file, json_encode( $photo_manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
